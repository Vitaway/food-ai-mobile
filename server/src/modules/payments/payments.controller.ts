import { Authorized, Body, Controller, CurrentUser, Get, Post, Req } from "routing-controllers";
import type { Request } from "express";
import type { User } from "../users/user.entity";
import { CreateCheckoutDto, IremboWebhookDto } from "./payments.dto";
import { paymentsService } from "./payments.service";

@Controller("/payments")
export class PaymentsController {
  @Get("/plans")
  plans() {
    return paymentsService.listPlans();
  }

  @Authorized(["consumer", "coach", "admin"])
  @Get("/subscription")
  mySubscription(@CurrentUser() user: User) {
    return paymentsService.getMySubscription(user.id);
  }

  @Authorized(["consumer"])
  @Post("/checkout")
  createCheckout(@CurrentUser() user: User, @Body() dto: CreateCheckoutDto) {
    return paymentsService.createCheckout(user.id, dto);
  }

  @Post("/irembo/webhook")
  webhook(@Req() req: Request, @Body() dto: IremboWebhookDto) {
    const signature =
      (req.headers["x-irembopay-signature"] as string | undefined) ??
      (req.headers["x-signature"] as string | undefined);
    const rawBody = (req as Request & { rawBody?: string }).rawBody ?? JSON.stringify(dto);
    return paymentsService.handleWebhook(dto, rawBody, signature);
  }

  @Authorized(["admin"])
  @Get("/summary")
  summary() {
    return paymentsService.paymentSummary();
  }
}
