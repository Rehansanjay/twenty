import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { WorkflowEntity } from 'src/engine/core-modules/workflow/entities/workflow.entity';
import { getWorkspaceCustomApplicationIdOrThrow } from 'src/engine/core-modules/workflow/utils/get-workspace-custom-application-id.util';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { type WorkflowWorkspaceEntity } from 'src/modules/workflow/common/standard-objects/workflow.workspace-entity';

@Injectable()
export class WorkflowCoreSyncService {
  constructor(
    @InjectWorkspaceScopedRepository(WorkflowEntity)
    private readonly workflowRepository: WorkspaceScopedRepository<WorkflowEntity>,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
  ) {}

  async upsertToCore(
    workspaceId: string,
    workflows: WorkflowWorkspaceEntity[],
  ): Promise<void> {
    if (workflows.length === 0) {
      return;
    }

    const applicationId = await getWorkspaceCustomApplicationIdOrThrow(
      this.workspaceRepository,
      workspaceId,
    );

    await this.workflowRepository.upsert(
      workspaceId,
      workflows.map((workflow) => ({
        id: workflow.id,
        name: workflow.name ?? null,
        lastPublishedVersionId: workflow.lastPublishedVersionId ?? null,
        universalIdentifier: uuidv4(),
        applicationId,
      })),
      ['id'],
    );
  }

  async deleteFromCore(
    workspaceId: string,
    workflowIds: string[],
  ): Promise<void> {
    if (workflowIds.length === 0) {
      return;
    }

    await this.workflowRepository.delete(workspaceId, {
      id: In(workflowIds),
    });
  }
}
