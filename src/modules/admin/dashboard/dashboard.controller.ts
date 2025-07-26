import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  async getDashboardMetrics() {
    try {
      const data = await this.dashboardService.getDashboardMetrics();
      return {
        message: 'Dashboard metrics retrieved successfully',
        data,
      };
    } catch (error) {
      throw error;
    }
  }
}
