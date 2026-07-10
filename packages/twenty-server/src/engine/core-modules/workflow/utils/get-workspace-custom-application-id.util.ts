import { isDefined } from 'twenty-shared/utils';
import { Repository } from 'typeorm';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

export const getWorkspaceCustomApplicationIdOrThrow = async (
  workspaceRepository: Repository<WorkspaceEntity>,
  workspaceId: string,
): Promise<string> => {
  const workspace = await workspaceRepository.findOne({
    where: { id: workspaceId },
    select: ['id', 'workspaceCustomApplicationId'],
  });

  if (!isDefined(workspace?.workspaceCustomApplicationId)) {
    throw new Error(
      `Workspace custom application not found for workspace ${workspaceId}`,
    );
  }

  return workspace.workspaceCustomApplicationId;
};
