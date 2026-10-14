import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { AskDto } from './dto/ask.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ask')
  async ask(@Body() body: AskDto) {
    return {
      answer: await this.aiService.ask(body.question),
    };
  }
}
