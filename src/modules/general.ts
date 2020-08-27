import { interfaces, AsyncContainerModule } from 'inversify';
import {
  ApplicationLifetime,
  APPLICATION_LIFETIME,
} from '@/application-lifetime';

export const generalModule = new AsyncContainerModule(
  async (bind: interfaces.Bind) => {
    bind<ApplicationLifetime>(APPLICATION_LIFETIME).to(ApplicationLifetime);
  },
);
