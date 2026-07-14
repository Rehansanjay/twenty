import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { ReconcileSystemRelationFieldUniversalIdentifierCommand } from 'src/database/commands/upgrade-version-command/2-22/2-22-workspace-command-1783925900000-reconcile-system-relation-field-universal-identifier.command';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { WorkspaceMigrationRunnerModule } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/workspace-migration-runner.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FieldMetadataEntity]),
    WorkspaceCacheModule,
    WorkspaceIteratorModule,
    WorkspaceMigrationRunnerModule,
  ],
  providers: [ReconcileSystemRelationFieldUniversalIdentifierCommand],
})
export class V2_22_UpgradeVersionCommandModule {}
