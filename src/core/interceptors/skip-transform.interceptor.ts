import { SetMetadata } from '@nestjs/common';

export const SKIP_TRANSFORM_METADATA = 'skip-transform';

export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_METADATA, true);
