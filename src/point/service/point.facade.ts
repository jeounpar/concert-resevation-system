import { Injectable } from '@nestjs/common';
import { PointReaderComponent } from '../component/point-reader.component';
import { PointMutatorComponent } from '../component/point-mutator.component';
import { PointLogMutatorComponent } from '../component/point-log-mutator.component';

@Injectable()
export class PointFacade {
  constructor(
    private readonly pointReader: PointReaderComponent,
    private readonly pointMutator: PointMutatorComponent,
    private readonly pointLogMutator: PointLogMutatorComponent,
  ) {}
}
