import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { authUsers } from 'drizzle-orm/supabase'
import type { Database, Transaction } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import {
  assessments,
  assistantConversations,
  assistantMessages,
  careLinks,
  checkInAddenda,
  checkIns,
  consents,
  insights,
  invitations,
  journalAccessLog,
  journalEntries,
  journalShareEntries,
  journalShares,
  notifications,
  professionalDocuments,
  professionalProfiles,
  profiles,
  pushSubscriptions,
  questionnaireAssignments,
  questionnaireResponses,
  reminderSettings,
  supportTickets,
  zenSessions,
  zenStepProgress,
} from '../../db/schema/index.ts'
import { memoriesOf, type MemoryRecord } from '../memories/memory.repository.ts'

export interface ExportPage {
  id: string
  title: string | null
  body: unknown
  plainText: string
  imagePaths: string[]
  createdAt: Date
  updatedAt: Date
}

export interface ExportConversation {
  id: string
  journalEntryId: string | null
  createdAt: Date
  updatedAt: Date
  messages: { role: string; content: string; createdAt: Date }[]
}

export interface ExportCheckIn {
  id: string
  moodLevel: number
  emotions: string[]
  contexts: string[]
  note: string | null
  recordedAt: Date
  addenda: { id: string; text: string; createdAt: Date }[]
}

export interface ExportDocument {
  path: string
  fileName: string
  contentType: string
  sizeBytes: number
  createdAt: Date
}

export interface ExportData {
  account: { id: string; email: string | null; createdAt: Date | null }
  profile: Record<string, unknown> & {
    accountType: string
    displayName: string | null
    avatarPath: string | null
    timezone: string
    locale: string | null
  }
  consents: Record<string, unknown>[]
  checkIns: ExportCheckIn[]
  assessments: Record<string, unknown>[]
  questionnaires: Record<string, unknown>[]
  pages: ExportPage[]
  shares: Record<string, unknown>[]
  careLinks: Record<string, unknown>[]
  invitations: Record<string, unknown>[]
  insights: Record<string, unknown>[]
  memories: MemoryRecord[]
  conversations: ExportConversation[]
  zen: Record<string, unknown>[]
  zenSessions: Record<string, unknown>[]
  reminders: { settings: Record<string, unknown> | null; devices: Record<string, unknown>[] }
  support: Record<string, unknown>[]
  notifications: Record<string, unknown>[]
  professional: Record<string, unknown> | null
  documents: ExportDocument[]
}

export interface ExportCollector {
  collect(userId: string): Promise<ExportData>
}

async function patientSide(tx: Transaction, userId: string) {
  const checkInRows = await tx
    .select({
      id: checkIns.id,
      moodLevel: checkIns.moodLevel,
      emotions: checkIns.emotions,
      contexts: checkIns.contexts,
      note: checkIns.note,
      recordedAt: checkIns.recordedAt,
    })
    .from(checkIns)
    .where(eq(checkIns.userId, userId))
    .orderBy(asc(checkIns.recordedAt))
  const addenda = await tx
    .select({
      id: checkInAddenda.id,
      checkInId: checkInAddenda.checkInId,
      text: checkInAddenda.text,
      createdAt: checkInAddenda.createdAt,
    })
    .from(checkInAddenda)
    .where(eq(checkInAddenda.userId, userId))
    .orderBy(asc(checkInAddenda.createdAt))
  const shares = await tx
    .select({
      id: journalShares.id,
      careLinkId: journalShares.careLinkId,
      scope: journalShares.scope,
      expiresAt: journalShares.expiresAt,
      revokedAt: journalShares.revokedAt,
      createdAt: journalShares.createdAt,
    })
    .from(journalShares)
    .where(eq(journalShares.patientId, userId))
    .orderBy(asc(journalShares.createdAt))
  const shareIds = shares.map((share) => share.id)
  const sharedPages =
    shareIds.length === 0
      ? []
      : await tx
          .select({ shareId: journalShareEntries.shareId, entryId: journalShareEntries.entryId })
          .from(journalShareEntries)
          .where(inArray(journalShareEntries.shareId, shareIds))
  const reads =
    shareIds.length === 0
      ? []
      : await tx
          .select({
            shareId: journalAccessLog.shareId,
            entryId: journalAccessLog.entryId,
            accessedAt: journalAccessLog.accessedAt,
          })
          .from(journalAccessLog)
          .where(inArray(journalAccessLog.shareId, shareIds))
          .orderBy(asc(journalAccessLog.accessedAt))
  return {
    checkIns: checkInRows.map((row) => ({
      ...row,
      addenda: addenda
        .filter((addendum) => addendum.checkInId === row.id)
        .map(({ id, text, createdAt }) => ({ id, text, createdAt })),
    })),
    shares: shares.map((share) => ({
      ...share,
      pages: sharedPages.filter((page) => page.shareId === share.id).map((page) => page.entryId),
      reads: reads
        .filter((read) => read.shareId === share.id)
        .map(({ entryId, accessedAt }) => ({ entryId, accessedAt })),
    })),
  }
}

async function conversationsOf(tx: Transaction, userId: string): Promise<ExportConversation[]> {
  const conversations = await tx
    .select({
      id: assistantConversations.id,
      journalEntryId: assistantConversations.journalEntryId,
      createdAt: assistantConversations.createdAt,
      updatedAt: assistantConversations.updatedAt,
    })
    .from(assistantConversations)
    .where(
      and(eq(assistantConversations.ownerId, userId), eq(assistantConversations.mode, 'personal')),
    )
    .orderBy(asc(assistantConversations.createdAt))
  const ids = conversations.map((conversation) => conversation.id)
  const messages =
    ids.length === 0
      ? []
      : await tx
          .select({
            conversationId: assistantMessages.conversationId,
            role: assistantMessages.role,
            content: assistantMessages.content,
            createdAt: assistantMessages.createdAt,
          })
          .from(assistantMessages)
          .where(inArray(assistantMessages.conversationId, ids))
          .orderBy(asc(assistantMessages.createdAt))
  return conversations.map((conversation) => ({
    ...conversation,
    messages: messages
      .filter((message) => message.conversationId === conversation.id)
      .map(({ role, content, createdAt }) => ({ role, content, createdAt })),
  }))
}

async function careOf(tx: Transaction, userId: string) {
  const asPatient = await tx
    .select({
      id: careLinks.id,
      professionalName: professionalProfiles.fullName,
      sharesHistory: careLinks.sharesHistory,
      consentVersion: careLinks.consentVersion,
      consentAcceptedAt: careLinks.consentAcceptedAt,
      startedAt: careLinks.startedAt,
      endedAt: careLinks.endedAt,
      endedBy: careLinks.endedBy,
    })
    .from(careLinks)
    .leftJoin(professionalProfiles, eq(professionalProfiles.userId, careLinks.professionalId))
    .where(eq(careLinks.patientId, userId))
    .orderBy(asc(careLinks.startedAt))
  const asProfessional = await tx
    .select({
      id: careLinks.id,
      sharesHistory: careLinks.sharesHistory,
      startedAt: careLinks.startedAt,
      endedAt: careLinks.endedAt,
      endedBy: careLinks.endedBy,
    })
    .from(careLinks)
    .where(eq(careLinks.professionalId, userId))
    .orderBy(asc(careLinks.startedAt))
  return [
    ...asPatient.map((link) => ({ role: 'patient', ...link })),
    ...asProfessional.map((link) => ({ role: 'professional', ...link })),
  ]
}

async function invitationsOf(tx: Transaction, userId: string) {
  const received = await tx
    .select({
      id: invitations.id,
      professionalName: professionalProfiles.fullName,
      channel: invitations.channel,
      status: invitations.status,
      createdAt: invitations.createdAt,
      respondedAt: invitations.respondedAt,
    })
    .from(invitations)
    .leftJoin(professionalProfiles, eq(professionalProfiles.userId, invitations.professionalId))
    .where(eq(invitations.patientId, userId))
  const sent = await tx
    .select({
      id: invitations.id,
      channel: invitations.channel,
      status: invitations.status,
      createdAt: invitations.createdAt,
      expiresAt: invitations.expiresAt,
      respondedAt: invitations.respondedAt,
    })
    .from(invitations)
    .where(eq(invitations.professionalId, userId))
  return [
    ...received.map((invitation) => ({ direction: 'received', ...invitation })),
    ...sent.map((invitation) => ({ direction: 'sent', ...invitation })),
  ]
}

async function ownRows(tx: Transaction, userId: string) {
  return {
    consents: await tx
      .select({
        kind: consents.kind,
        version: consents.version,
        grantedAt: consents.grantedAt,
        revokedAt: consents.revokedAt,
      })
      .from(consents)
      .where(eq(consents.userId, userId))
      .orderBy(asc(consents.grantedAt)),
    assessments: await tx
      .select({
        id: assessments.id,
        instrument: assessments.instrument,
        answers: assessments.answers,
        totalScore: assessments.totalScore,
        severity: assessments.severity,
        hasRiskFlag: assessments.hasRiskFlag,
        completedAt: assessments.completedAt,
      })
      .from(assessments)
      .where(eq(assessments.userId, userId))
      .orderBy(asc(assessments.completedAt)),
    pages: await tx
      .select({
        id: journalEntries.id,
        title: journalEntries.title,
        body: journalEntries.body,
        plainText: journalEntries.plainText,
        imagePaths: journalEntries.imagePaths,
        createdAt: journalEntries.createdAt,
        updatedAt: journalEntries.updatedAt,
      })
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(asc(journalEntries.createdAt)),
    insights: await tx
      .select({
        id: insights.id,
        periodStart: insights.periodStart,
        periodEnd: insights.periodEnd,
        checkInCount: insights.checkInCount,
        content: insights.content,
        createdAt: insights.createdAt,
      })
      .from(insights)
      .where(and(eq(insights.patientId, userId), eq(insights.audience, 'patient')))
      .orderBy(asc(insights.createdAt)),
    zen: await tx
      .select({
        trackId: zenStepProgress.trackId,
        stepId: zenStepProgress.stepId,
        completedAt: zenStepProgress.completedAt,
      })
      .from(zenStepProgress)
      .where(eq(zenStepProgress.userId, userId))
      .orderBy(asc(zenStepProgress.completedAt)),
    zenSessions: await tx
      .select({
        id: zenSessions.id,
        kind: zenSessions.kind,
        contentId: zenSessions.contentId,
        startedAt: zenSessions.startedAt,
        secondsCompleted: zenSessions.secondsCompleted,
        completed: zenSessions.completed,
        feelingAfter: zenSessions.feelingAfter,
        createdAt: zenSessions.createdAt,
      })
      .from(zenSessions)
      .where(eq(zenSessions.userId, userId))
      .orderBy(asc(zenSessions.startedAt)),
    support: await tx
      .select({
        number: supportTickets.number,
        subject: supportTickets.subject,
        customSubject: supportTickets.customSubject,
        message: supportTickets.message,
        attachmentName: supportTickets.attachmentName,
        status: supportTickets.status,
        closingNote: supportTickets.closingNote,
        createdAt: supportTickets.createdAt,
        closedAt: supportTickets.closedAt,
      })
      .from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(asc(supportTickets.createdAt)),
    notifications: await tx
      .select({
        kind: notifications.kind,
        createdAt: notifications.createdAt,
        readAt: notifications.readAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(asc(notifications.createdAt)),
  }
}

function questionnairesOf(tx: Transaction, userId: string) {
  return tx
    .select({
      id: questionnaireAssignments.id,
      professionalName: professionalProfiles.fullName,
      instrumentId: questionnaireAssignments.instrumentId,
      variant: questionnaireAssignments.variant,
      note: questionnaireAssignments.note,
      repeatEveryDays: questionnaireAssignments.repeatEveryDays,
      status: questionnaireAssignments.status,
      availableFrom: questionnaireAssignments.availableFrom,
      createdAt: questionnaireAssignments.createdAt,
      completedAt: questionnaireAssignments.completedAt,
      cancelledAt: questionnaireAssignments.cancelledAt,
      response: {
        instrumentVersion: questionnaireResponses.instrumentVersion,
        locale: questionnaireResponses.locale,
        answers: questionnaireResponses.answers,
        score: questionnaireResponses.score,
        flags: questionnaireResponses.flags,
        consentedAt: questionnaireResponses.consentedAt,
        startedAt: questionnaireResponses.startedAt,
        completedAt: questionnaireResponses.completedAt,
      },
    })
    .from(questionnaireAssignments)
    .leftJoin(
      professionalProfiles,
      eq(professionalProfiles.userId, questionnaireAssignments.professionalId),
    )
    .leftJoin(
      questionnaireResponses,
      eq(questionnaireResponses.assignmentId, questionnaireAssignments.id),
    )
    .where(eq(questionnaireAssignments.patientId, userId))
    .orderBy(asc(questionnaireAssignments.createdAt))
}

async function remindersOf(tx: Transaction, userId: string) {
  const [settings] = await tx
    .select({
      enabled: reminderSettings.enabled,
      time: reminderSettings.time,
      days: reminderSettings.days,
      push: reminderSettings.push,
      email: reminderSettings.email,
      lastSentOn: reminderSettings.lastSentOn,
    })
    .from(reminderSettings)
    .where(eq(reminderSettings.userId, userId))
  const devices = await tx
    .select({ createdAt: pushSubscriptions.createdAt, lastUsedAt: pushSubscriptions.lastUsedAt })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))
  return { settings: settings ?? null, devices }
}

async function professionalOf(tx: Transaction, userId: string) {
  const [professional] = await tx
    .select({
      kind: professionalProfiles.kind,
      fullName: professionalProfiles.fullName,
      registration: professionalProfiles.registration,
      status: professionalProfiles.status,
      emergencyWhatsapp: sql<string | null>`public.own_emergency_whatsapp()`,
      createdAt: professionalProfiles.createdAt,
      verifiedAt: professionalProfiles.verifiedAt,
      reviewNote: professionalProfiles.reviewNote,
      reviewedAt: professionalProfiles.reviewedAt,
    })
    .from(professionalProfiles)
    .where(eq(professionalProfiles.userId, userId))
  const documents = await tx
    .select({
      path: professionalDocuments.path,
      fileName: professionalDocuments.fileName,
      contentType: professionalDocuments.contentType,
      sizeBytes: professionalDocuments.sizeBytes,
      createdAt: professionalDocuments.createdAt,
    })
    .from(professionalDocuments)
    .where(eq(professionalDocuments.userId, userId))
    .orderBy(asc(professionalDocuments.createdAt))
  return { professional: professional ?? null, documents }
}

export function createExportCollector(db: Database): ExportCollector {
  return {
    async collect(userId) {
      const [account] = await db
        .select({ id: authUsers.id, email: authUsers.email, createdAt: authUsers.createdAt })
        .from(authUsers)
        .where(eq(authUsers.id, userId))
      return withUser(db, userId, async (tx) => {
        const [profile] = await tx
          .select({
            accountType: profiles.accountType,
            displayName: profiles.displayName,
            avatarPath: profiles.avatarPath,
            timezone: profiles.timezone,
            locale: profiles.locale,
            journalInInsights: profiles.journalInInsights,
            memoriesEnabled: profiles.memoriesEnabled,
            onboardingCompletedAt: profiles.onboardingCompletedAt,
            createdAt: profiles.createdAt,
          })
          .from(profiles)
          .where(eq(profiles.id, userId))
        if (profile === undefined) {
          throw new Error('The profile to export was not found')
        }
        const own = await ownRows(tx, userId)
        return {
          account: {
            id: userId,
            email: account?.email ?? null,
            createdAt: account?.createdAt ?? null,
          },
          profile,
          ...own,
          ...(await patientSide(tx, userId)),
          questionnaires: await questionnairesOf(tx, userId),
          careLinks: await careOf(tx, userId),
          invitations: await invitationsOf(tx, userId),
          memories: await memoriesOf(tx, userId),
          conversations: await conversationsOf(tx, userId),
          reminders: await remindersOf(tx, userId),
          ...(await professionalOf(tx, userId)),
        }
      })
    },
  }
}
