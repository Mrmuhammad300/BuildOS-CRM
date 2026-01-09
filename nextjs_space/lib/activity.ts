import { prisma } from './db';
import { ActivityType } from '@prisma/client';

interface CreateActivityParams {
  userId: string;
  projectId?: string;
  type: ActivityType;
  description: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
}

/**
 * Create an activity log entry
 */
export async function createActivity(params: CreateActivityParams) {
  const {
    userId,
    projectId,
    type,
    description,
    entityType,
    entityId,
    metadata,
  } = params;

  try {
    const activity = await prisma.activity.create({
      data: {
        userId,
        projectId,
        type,
        description,
        entityType,
        entityId,
        metadata,
      },
    });

    return activity;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
}

/**
 * Get recent activities for a user
 */
export async function getUserActivities(userId: string, limit: number = 20) {
  try {
    const activities = await prisma.activity.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return activities;
  } catch (error) {
    console.error('Error fetching user activities:', error);
    throw error;
  }
}

/**
 * Get recent activities for a project
 */
export async function getProjectActivities(projectId: string, limit: number = 50) {
  try {
    const activities = await prisma.activity.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return activities;
  } catch (error) {
    console.error('Error fetching project activities:', error);
    throw error;
  }
}

/**
 * Get global activity feed (all activities across all projects)
 */
export async function getGlobalActivities(limit: number = 100) {
  try {
    const activities = await prisma.activity.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return activities;
  } catch (error) {
    console.error('Error fetching global activities:', error);
    throw error;
  }
}
