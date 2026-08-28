import { Router } from 'express';
import { optionalAuthenticateToken, AuthenticatedRequest } from '../auth/middleware.js';
import { conversationStore, ServerChatMessage } from '../db/conversationStore.js';
import { userDataStore } from '../db/userDataStore.js';
import { aiGateway } from '../ai/aiGateway.js';
import { PatientContext } from '../types/medical.js';

export const chatRouter = Router();

// Helper to determine active userId (authenticated or guest token/header)
function getEffectiveUserId(req: AuthenticatedRequest): string {
  if (req.user && req.user.id) {
    return req.user.id;
  }
  const guestHeader = req.headers['x-guest-session-id'];
  if (typeof guestHeader === 'string' && guestHeader.trim().length > 0) {
    return `guest-${guestHeader.trim()}`;
  }
  return 'guest-default-session';
}

// 1. List conversations for the active user/guest
chatRouter.get('/conversations', optionalAuthenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    const userId = getEffectiveUserId(req);
    let list = conversationStore.getConversations(userId);

    // If no conversations yet, create an initial one automatically
    if (list.length === 0) {
      const initial = conversationStore.createConversation(userId);
      list = [initial];
    }

    res.json({
      success: true,
      conversations: list.map((c) => ({
        id: c.id,
        title: c.title,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        messageCount: c.messages.length,
        lastMessage: c.messages[c.messages.length - 1]?.content || '',
        urgency: c.clinicalContext.urgency || 'ROUTINE',
        status: c.status,
      })),
    });
  } catch (error: any) {
    console.error('Error listing conversations:', error);
    res.status(500).json({ error: 'Failed to retrieve conversations list' });
  }
});

// 2. Create a new conversation
chatRouter.post('/conversations', optionalAuthenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    const userId = getEffectiveUserId(req);
    const { title } = req.body;
    const newConv = conversationStore.createConversation(userId, title);
    res.status(201).json({
      success: true,
      conversation: newConv,
    });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation session' });
  }
});

// 3. Get full conversation by ID
chatRouter.get('/conversations/:id', optionalAuthenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    const userId = getEffectiveUserId(req);
    const convId = req.params.id;
    const conv = conversationStore.getConversationById(userId, convId);

    if (!conv) {
      return res.status(404).json({ error: 'Conversation session not found' });
    }

    res.json({
      success: true,
      conversation: conv,
    });
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to retrieve conversation details' });
  }
});

// 4. Update conversation title
chatRouter.put('/conversations/:id/title', optionalAuthenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    const userId = getEffectiveUserId(req);
    const convId = req.params.id;
    const { title } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Valid title string is required' });
    }

    const updated = conversationStore.updateTitle(userId, convId, title);
    if (!updated) {
      return res.status(404).json({ error: 'Conversation not found or cannot be modified' });
    }

    res.json({ success: true, message: 'Conversation title updated successfully' });
  } catch (error: any) {
    console.error('Error updating title:', error);
    res.status(500).json({ error: 'Failed to update conversation title' });
  }
});

// 5. Delete a conversation
chatRouter.delete('/conversations/:id', optionalAuthenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    const userId = getEffectiveUserId(req);
    const convId = req.params.id;

    const deleted = conversationStore.deleteConversation(userId, convId);
    if (!deleted) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// 6. Send message to conversation (Executes the 8-step AI Clinical Dialogue Pipeline)
chatRouter.post('/conversations/:id/messages', optionalAuthenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = getEffectiveUserId(req);
    const convId = req.params.id;
    const { message, language = 'ar' } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    let conv = conversationStore.getConversationById(userId, convId);
    if (!conv) {
      conv = conversationStore.createConversation(userId);
    }

    // 1. Record User Message
    const userMsg: ServerChatMessage = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      conversationId: conv.id,
      sender: 'user',
      content: message.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // 2. Resolve privacy-conscious patient context if user is signed in
    let patientContext: PatientContext | undefined;
    if (req.user) {
      try {
        const profile = userDataStore.getProfile(req.user, req.user.id);
        const conditions = userDataStore.getConditions(req.user, req.user.id);
        const medications = userDataStore.getMedications(req.user, req.user.id);
        const allergies = userDataStore.getAllergies(req.user, req.user.id);

        patientContext = {
          age: profile.age,
          gender: profile.gender,
          chronicConditions: conditions.map((c) => c.nameAr),
          currentMedications: medications.map((m) => m.nameAr),
          allergies: allergies.map((a) => a.allergenAr),
        };
      } catch (err) {
        console.warn('Could not read user profile for dialogue enrichment:', err);
      }
    }

    // Append user message immediately
    conversationStore.addMessage(userId, conv.id, userMsg);

    // 3. Dispatch to AI Gateway (Frontend -> Backend -> AI Gateway -> AI Provider)
    const dialogueResult = await aiGateway.processDialogue({
      conversationId: conv.id,
      message: message.trim(),
      language,
      patientContext,
      conversationHistory: conv.messages.map((m) => ({
        sender: m.sender,
        content: m.content,
        timestamp: m.timestamp,
      })),
      clinicalContext: conv.clinicalContext,
    });

    const isEmergency = dialogueResult.urgency === 'EMERGENCY';

    // 4. Construct Assistant Response Message
    const assistantMsg: ServerChatMessage = {
      id: dialogueResult.messageId,
      conversationId: conv.id,
      sender: 'assistant',
      content: dialogueResult.content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      intent: dialogueResult.intent,
      isHealthRelated: dialogueResult.isHealthRelated,
      extractedAttributes: dialogueResult.extractedAttributes,
      nextFollowUpQuestion: dialogueResult.nextFollowUpQuestion,
      redFlagsDetected: dialogueResult.redFlagsDetected,
      evidenceSources: dialogueResult.evidenceRetrieved,
      questionsForDoctorAr: dialogueResult.questionsForDoctorAr,
      questionsForDoctorEn: dialogueResult.questionsForDoctorEn,
      urgencyTag: dialogueResult.urgency,
      isEmergency,
      safetyRiskLevel: dialogueResult.safetyRiskLevel,
      safetyOverride: dialogueResult.safetyOverride,
      safetyEvaluation: dialogueResult.safetyEvaluation,
      emergencyPayload: dialogueResult.emergencyPayload,
      providerUsed: dialogueResult.providerUsed,
      pipelineAudits: dialogueResult.pipelineAudits,
    };

    // 5. Update Conversation Context in Memory Store
    const updatedConv = conversationStore.addMessage(
      userId,
      conv.id,
      assistantMsg,
      {
        primarySymptom: dialogueResult.extractedAttributes.primarySymptom || conv.clinicalContext.primarySymptom,
        intent: dialogueResult.intent,
        isHealthRelated: dialogueResult.isHealthRelated,
        extractedAttributes: {
          ...conv.clinicalContext.extractedAttributes,
          ...dialogueResult.extractedAttributes,
        },
        missingAttributes: dialogueResult.missingAttributes,
        redFlags: dialogueResult.redFlagsDetected,
        urgency: dialogueResult.urgency,
        currentQuestionIndex: (conv.clinicalContext.currentQuestionIndex || 0) + 1,
        completedTriage: !dialogueResult.needsFollowUp || isEmergency,
      },
      dialogueResult.suggestedConversationTitle
    );

    // Return the response seamlessly to frontend
    res.json({
      success: true,
      message: assistantMsg,
      conversation: updatedConv,
      audits: dialogueResult.pipelineAudits,
    });
  } catch (error: any) {
    console.error('Error processing dialogue message in /api/chat/conversations/:id/messages:', error);
    // Return friendly, safe clinical fallback error rather than crashing
    res.status(500).json({
      error: 'Failed to process clinical dialogue message safely',
      details: error?.message || 'Internal Gateway Error',
    });
  }
});
