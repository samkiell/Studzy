import { relations } from "drizzle-orm/relations";
import { resources, bookmarks, profiles, chatSessions, chatMessages, courses, attempts, usersInAuth, theoryExams, theoryQuestions, theorySubQuestions, examResults, questions, discussions, attemptAnswers, theoryAttempts, userActivity, userProgress, studyPresence } from "./schema";

export const bookmarksRelations = relations(bookmarks, ({one}) => ({
	resource: one(resources, {
		fields: [bookmarks.resourceId],
		references: [resources.id]
	}),
	profile: one(profiles, {
		fields: [bookmarks.userId],
		references: [profiles.id]
	}),
}));

export const resourcesRelations = relations(resources, ({one, many}) => ({
	bookmarks: many(bookmarks),
	questions: many(questions),
	discussions: many(discussions),
	course: one(courses, {
		fields: [resources.courseId],
		references: [courses.id]
	}),
	profile: one(profiles, {
		fields: [resources.uploaderId],
		references: [profiles.id]
	}),
	userActivities: many(userActivity),
	userProgresses: many(userProgress),
}));

export const profilesRelations = relations(profiles, ({one, many}) => ({
	bookmarks: many(bookmarks),
	discussions: many(discussions),
	usersInAuth: one(usersInAuth, {
		fields: [profiles.id],
		references: [usersInAuth.id]
	}),
	resources: many(resources),
	studyPresences: many(studyPresence),
}));

export const chatMessagesRelations = relations(chatMessages, ({one}) => ({
	chatSession: one(chatSessions, {
		fields: [chatMessages.sessionId],
		references: [chatSessions.id]
	}),
}));

export const chatSessionsRelations = relations(chatSessions, ({one, many}) => ({
	chatMessages: many(chatMessages),
	usersInAuth: one(usersInAuth, {
		fields: [chatSessions.userId],
		references: [usersInAuth.id]
	}),
}));

export const attemptsRelations = relations(attempts, ({one, many}) => ({
	course: one(courses, {
		fields: [attempts.courseId],
		references: [courses.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [attempts.userId],
		references: [usersInAuth.id]
	}),
	attemptAnswers: many(attemptAnswers),
}));

export const coursesRelations = relations(courses, ({many}) => ({
	attempts: many(attempts),
	theoryExams: many(theoryExams),
	examResults: many(examResults),
	questions: many(questions),
	resources: many(resources),
	studyPresences: many(studyPresence),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	attempts: many(attempts),
	chatSessions: many(chatSessions),
	examResults: many(examResults),
	profiles: many(profiles),
	theoryAttempts: many(theoryAttempts),
	userActivities: many(userActivity),
	userProgresses: many(userProgress),
}));

export const theoryExamsRelations = relations(theoryExams, ({one, many}) => ({
	course: one(courses, {
		fields: [theoryExams.courseId],
		references: [courses.id]
	}),
	theoryQuestions: many(theoryQuestions),
	theoryAttempts: many(theoryAttempts),
}));

export const theorySubQuestionsRelations = relations(theorySubQuestions, ({one}) => ({
	theoryQuestion: one(theoryQuestions, {
		fields: [theorySubQuestions.questionId],
		references: [theoryQuestions.id]
	}),
}));

export const theoryQuestionsRelations = relations(theoryQuestions, ({one, many}) => ({
	theorySubQuestions: many(theorySubQuestions),
	theoryExam: one(theoryExams, {
		fields: [theoryQuestions.examId],
		references: [theoryExams.id]
	}),
}));

export const examResultsRelations = relations(examResults, ({one}) => ({
	course: one(courses, {
		fields: [examResults.examId],
		references: [courses.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [examResults.userId],
		references: [usersInAuth.id]
	}),
}));

export const questionsRelations = relations(questions, ({one, many}) => ({
	resource: one(resources, {
		fields: [questions.bankId],
		references: [resources.id]
	}),
	course: one(courses, {
		fields: [questions.courseId],
		references: [courses.id]
	}),
	attemptAnswers: many(attemptAnswers),
}));

export const discussionsRelations = relations(discussions, ({one, many}) => ({
	discussion: one(discussions, {
		fields: [discussions.parentId],
		references: [discussions.id],
		relationName: "discussions_parentId_discussions_id"
	}),
	discussions: many(discussions, {
		relationName: "discussions_parentId_discussions_id"
	}),
	resource: one(resources, {
		fields: [discussions.resourceId],
		references: [resources.id]
	}),
	profile: one(profiles, {
		fields: [discussions.userId],
		references: [profiles.id]
	}),
}));

export const attemptAnswersRelations = relations(attemptAnswers, ({one}) => ({
	attempt: one(attempts, {
		fields: [attemptAnswers.attemptId],
		references: [attempts.id]
	}),
	question: one(questions, {
		fields: [attemptAnswers.questionId],
		references: [questions.id]
	}),
}));

export const theoryAttemptsRelations = relations(theoryAttempts, ({one}) => ({
	theoryExam: one(theoryExams, {
		fields: [theoryAttempts.examId],
		references: [theoryExams.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [theoryAttempts.userId],
		references: [usersInAuth.id]
	}),
}));

export const userActivityRelations = relations(userActivity, ({one}) => ({
	resource: one(resources, {
		fields: [userActivity.resourceId],
		references: [resources.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [userActivity.userId],
		references: [usersInAuth.id]
	}),
}));

export const userProgressRelations = relations(userProgress, ({one}) => ({
	resource: one(resources, {
		fields: [userProgress.resourceId],
		references: [resources.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [userProgress.userId],
		references: [usersInAuth.id]
	}),
}));

export const studyPresenceRelations = relations(studyPresence, ({one}) => ({
	course: one(courses, {
		fields: [studyPresence.courseId],
		references: [courses.id]
	}),
	profile: one(profiles, {
		fields: [studyPresence.userId],
		references: [profiles.id]
	}),
}));