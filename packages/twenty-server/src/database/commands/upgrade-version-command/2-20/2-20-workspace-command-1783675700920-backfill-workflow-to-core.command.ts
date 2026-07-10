import { Command } from 'nest-commander';
import { EntityMetadataNotFoundError } from 'typeorm/error/EntityMetadataNotFoundError';

import { ActiveOrSuspendedWorkspaceCommandRunner } from 'src/database/commands/command-runners/active-or-suspended-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { WorkflowCoreSyncService } from 'src/engine/core-modules/workflow/services/workflow-core-sync.service';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type WorkflowWorkspaceEntity } from 'src/modules/workflow/common/standard-objects/workflow.workspace-entity';

@RegisteredWorkspaceCommand('2.20.0', 1783675700920)
@Command({
  name: 'upgrade:2-20:backfill-workflow-to-core',
  description:
    'Copy each workspace workflow (name, lastPublishedVersionId) into the core workflow table, preserving ids',
})
export class BackfillWorkflowToCoreCommand extends ActiveOrSuspendedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly workflowCoreSyncService: WorkflowCoreSyncService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    let workspaceWorkflows: WorkflowWorkspaceEntity[];

    try {
      workspaceWorkflows =
        await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
          async () => {
            const workflowRepository =
              await this.globalWorkspaceOrmManager.getRepository<WorkflowWorkspaceEntity>(
                workspaceId,
                'workflow',
                { shouldBypassPermissionChecks: true },
              );

            return workflowRepository.find();
          },
          buildSystemAuthContext(workspaceId),
        );
    } catch (error) {
      if (error instanceof EntityMetadataNotFoundError) {
        this.logger.log(
          `workflow object does not exist for workspace ${workspaceId}, skipping`,
        );

        return;
      }

      throw error;
    }

    if (options.dryRun === true) {
      this.logger.log(
        `[DRY RUN] Would upsert ${workspaceWorkflows.length} workflow row(s) into core for workspace ${workspaceId}`,
      );

      return;
    }

    await this.workflowCoreSyncService.upsertToCore(
      workspaceId,
      workspaceWorkflows,
    );

    this.logger.log(
      `Backfilled ${workspaceWorkflows.length} workflow row(s) into core for workspace ${workspaceId}`,
    );
  }
}
