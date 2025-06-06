/**
 * The foundational class for all FCM push notification events.
 */
export abstract class BaseFcmEvent {
  /**
   * @param fcmToken The FCM registration token of the target device.
   * @param title The title of the push notification.
   * @param body The body/message of the push notification.
   * @param data A key-value map of data to send to the client app.
   * It should always include an `eventType` for client-side routing.
   */
  constructor(
    public readonly fcmToken: string,
    public readonly title: string,
    public readonly body: string,
    public readonly data: { [key: string]: string },
  ) {}
}

// --- User Event Examples ---

export class UserSuccessfulLoginFcmEvent extends BaseFcmEvent {
  constructor(
    fcmToken: string,
    deviceDetails: { ip: string; userAgent: string },
  ) {
    super(
      fcmToken,
      'Security Alert: New Login', // Title
      `We detected a new login from ${deviceDetails.ip}. Tap to review.`, // Body
      {
        // Data Payload
        eventType: 'USER_SUCCESSFUL_LOGIN',
        ip: deviceDetails.ip,
        userAgent: deviceDetails.userAgent,
      },
    );
  }
}

export class UserGiftCardUpdateFcmEvent extends BaseFcmEvent {
  constructor(fcmToken: string, update: { cardId: string; status: string }) {
    super(
      fcmToken,
      'Gift Card Status Update', // Title
      `Your gift card has been updated to: ${update.status}.`, // Body
      {
        // Data Payload
        eventType: 'USER_GIFT_CARD_UPDATE',
        cardId: update.cardId,
        status: update.status,
      },
    );
  }
}

export class UserTransactionInfoFcmEvent extends BaseFcmEvent {
  constructor(
    fcmToken: string,
    transaction: { id: string; amount: number; status: 'completed' | 'failed' },
  ) {
    const title =
      transaction.status === 'completed'
        ? `Transaction Successful`
        : `Transaction Failed`;
    const body = `Your transaction of $${transaction.amount} has ${transaction.status}.`;

    super(fcmToken, title, body, {
      eventType: 'USER_TRANSACTION_INFO',
      transactionId: transaction.id,
      status: transaction.status,
    });
  }
}

// --- Admin Event Examples ---

export class AdminNewGiftCardSubmissionFcmEvent extends BaseFcmEvent {
  constructor(
    adminFcmToken: string,
    submission: { userEmail: string; amount: number },
  ) {
    super(
      adminFcmToken,
      'New Gift Card Submission', // Title
      `A new gift card for $${submission.amount} from ${submission.userEmail} requires review.`, // Body
      {
        // Data Payload
        eventType: 'ADMIN_NEW_GIFT_CARD',
        userEmail: submission.userEmail,
      },
    );
  }
}

export class AdminApproveUserFcmEvent extends BaseFcmEvent {
  constructor(
    adminFcmToken: string,
    approvedUser: { email: string; adminName: string },
  ) {
    super(
      adminFcmToken,
      'User Approved',
      `${approvedUser.adminName} has approved the user: ${approvedUser.email}.`,
      {
        eventType: 'ADMIN_USER_APPROVED',
        approvedUserEmail: approvedUser.email,
        adminName: approvedUser.adminName,
      },
    );
  }
}
