import { ConfigService } from '@nestjs/config';

export enum EmailNotificationEvents {
  // --- User Events ---
  userRegistered = 'userRegistered',
  userLoginAttempt = 'userLoginAttempt',
  userSuccessfulLogin = 'userSuccessfulLogin',
  userConfirmEmail = 'userConfirmEmail',
  userCompleteSetup = 'userCompleteSetup',
  userChangePassword = 'userChangePassword',
  userChangePin = 'userChangePin',
  userSubmitGiftCard = 'userSubmitGiftCard',
  userTransactionInfo = 'userTransactionInfo',
  userGiftCardUpdate = 'userGiftCardUpdate',

  // --- Admin Events ---
  adminLoginAttempt = 'adminLoginAttempt',
  adminSuccessfulLogin = 'adminSuccessfulLogin',
  adminConfirmEmail = 'adminConfirmEmail',
  adminApproveUser = 'adminApproveUser',
  adminSuspendUser = 'adminSuspendUser',

  // --- Newly Added Admin Events ---
  adminNewGiftCardSubmission = 'adminNewGiftCardSubmission',
  adminNewTransaction = 'adminNewTransaction',
  adminApproveGiftCard = 'adminApproveGiftCard',
  adminSuspendGiftCard = 'adminSuspendGiftCard',
  adminPushNotification = 'adminPushNotification',
}

/**
 * The foundational class for all email events.
 * It ensures every email event has a type, a recipient, a template, a subject, and a timestamp.
 */
export abstract class BaseEmailEvent {
  public readonly timestamp: Date;

  constructor(
    public readonly emailType: EmailNotificationEvents,
    public readonly email: string,
    public readonly emailTemplate: string,
    public readonly emailSubject: string,
  ) {
    this.timestamp = new Date();
  }
}

/**
 * Base class for all events sent to a regular user.
 * The email is provided directly.
 */
export abstract class UserEmailEvent extends BaseEmailEvent {
  constructor(
    email: string,
    emailType: EmailNotificationEvents,
    emailTemplate: string,
    emailSubject: string,
  ) {
    super(emailType, email, emailTemplate, emailSubject);
  }
}

/**
 * Base class for all events sent to an administrator.
 * The recipient email defaults to the ADMIN_EMAIL from environment variables
 * but can be overridden.
 */
export abstract class AdminEmailEvent extends BaseEmailEvent {
  constructor(
    configService: ConfigService,
    emailType: EmailNotificationEvents,
    emailTemplate: string,
    emailSubject: string,
    // Allows overriding the default admin email if necessary
    recipientEmail?: string,
  ) {
    const adminEmail =
      recipientEmail || configService.get<string>('ADMIN_EMAIL');

    if (!adminEmail) {
      throw new Error('ADMIN_EMAIL environment variable is not set.');
    }

    super(emailType, adminEmail, emailTemplate, emailSubject);
  }
}

//--- User Event Classes ---

export class UserRegisteredEvent extends UserEmailEvent {
  constructor(
    email: string,
    public readonly code: string,
  ) {
    super(
      email,
      EmailNotificationEvents.userRegistered,
      'user-verification-code', // Template file: user-verification-code.hbs
      'Welcome! Please Verify Your Email',
    );
  }
}

export class UserLoginAttemptEvent extends UserEmailEvent {
  constructor(
    email: string,
    public readonly code: string,
  ) {
    super(
      email,
      EmailNotificationEvents.userLoginAttempt,
      'user-verification-code', // Re-using the same template
      'Your Login Verification Code',
    );
  }
}

export class UserSuccessfulLoginEvent extends UserEmailEvent {
  constructor(
    email: string,
    public readonly deviceDetails: { ip: string; userAgent: string },
  ) {
    super(
      email,
      EmailNotificationEvents.userSuccessfulLogin,
      'user-successful-login',
      'Successful Login to Your Account',
    );
  }
}

export class UserConfirmEmailEvent extends UserEmailEvent {
  constructor(
    email: string,
    public readonly code: string,
  ) {
    super(
      email,
      EmailNotificationEvents.userConfirmEmail,
      'user-verification-code',
      'Password Reset Verification Code',
    );
  }
}

export class UserCompleteSetupEvent extends UserEmailEvent {
  constructor(
    email: string,
    public readonly name: string,
  ) {
    super(
      email,
      EmailNotificationEvents.userCompleteSetup,
      'user-complete-setup',
      'Your Account Setup is Complete!',
    );
  }
}

export class UserChangePasswordEvent extends UserEmailEvent {
  constructor(email: string) {
    super(
      email,
      EmailNotificationEvents.userChangePassword,
      'user-security-alert',
      'Your Password Has Been Changed',
    );
    // You can add public properties here if the template needs them, e.g., public readonly name: string
  }
}

export class UserChangePinEvent extends UserEmailEvent {
  constructor(email: string) {
    super(
      email,
      EmailNotificationEvents.userChangePin,
      'user-security-alert',
      'Your Transaction PIN Has Been Changed',
    );
  }
}

export class UserSubmitGiftCardEvent extends UserEmailEvent {
  constructor(
    email: string,
    public readonly cardDetails: { type: string; amount: number },
  ) {
    super(
      email,
      EmailNotificationEvents.userSubmitGiftCard,
      'user-giftcard-update',
      'Your Gift Card Has Been Submitted',
    );
  }
}

export class UserTransactionInfoEvent extends UserEmailEvent {
  constructor(
    email: string,
    public readonly transaction: { id: string; amount: number; status: string },
  ) {
    super(
      email,
      EmailNotificationEvents.userTransactionInfo,
      'user-transaction-info',
      'Update on Your Transaction',
    );
  }
}

export class UserGiftCardUpdateEvent extends UserEmailEvent {
  constructor(
    email: string,
    public readonly update: {
      cardType: string;
      status: string;
      reason?: string;
    },
  ) {
    super(
      email,
      EmailNotificationEvents.userGiftCardUpdate,
      'user-giftcard-update',
      'An Update on Your Gift Card',
    );
  }
}

//--- Admin Event Classes ---

export class AdminLoginAttemptEvent extends AdminEmailEvent {
  constructor(
    configService: ConfigService,
    public readonly code: string,
    adminEmail?: string,
  ) {
    super(
      configService,
      EmailNotificationEvents.adminLoginAttempt,
      'admin-verification-code',
      'Admin Login Verification Code',
      adminEmail,
    );
  }
}

export class AdminSuccessfulLoginEvent extends AdminEmailEvent {
  constructor(
    configService: ConfigService,
    public readonly deviceDetails: { ip: string; userAgent: string },
    adminEmail?: string,
  ) {
    super(
      configService,
      EmailNotificationEvents.adminSuccessfulLogin,
      'admin-successful-login',
      'Successful Admin Login',
      adminEmail,
    );
  }
}

export class AdminConfirmEmailEvent extends AdminEmailEvent {
  constructor(
    configService: ConfigService,
    public readonly code: string,
    adminEmail?: string,
  ) {
    super(
      configService,
      EmailNotificationEvents.adminConfirmEmail,
      'admin-verification-code',
      'Admin Email Confirmation Code',
      adminEmail,
    );
  }
}

export class AdminApproveUserEvent extends AdminEmailEvent {
  constructor(
    configService: ConfigService,
    public readonly approvedUser: { email: string; name: string },
  ) {
    super(
      configService,
      EmailNotificationEvents.adminApproveUser,
      'admin-general-notification',
      'User Account Approved',
      // Note: the recipient is the admin, the payload contains the user's info
    );
  }
}

export class AdminSuspendUserEvent extends AdminEmailEvent {
  constructor(
    configService: ConfigService,
    public readonly suspendedUser: { email: string; reason: string },
  ) {
    super(
      configService,
      EmailNotificationEvents.adminSuspendUser,
      'admin-general-notification',
      'User Account Suspended',
    );
  }
}

/**
 * Informs an admin that a user has submitted a new gift card for processing.
 * Corresponds to your rule: "admingiftcard updated informs admin of new giftcard transaction"
 */
export class AdminNewGiftCardSubmissionEvent extends AdminEmailEvent {
  constructor(
    configService: ConfigService,
    public readonly submission: {
      userEmail: string;
      cardType: string;
      amount: number;
    },
    adminEmail?: string,
  ) {
    super(
      configService,
      EmailNotificationEvents.adminNewGiftCardSubmission,
      'admin-activity-alert', // A generic template for activity notifications
      'New Gift Card Submitted for Review',
      adminEmail,
    );
  }
}

/**
 * Informs an admin about a new transaction that has occurred.
 * Corresponds to your rule: "adminTransactionInfo informs admin of new transaction"
 */
export class AdminNewTransactionEvent extends AdminEmailEvent {
  constructor(
    configService: ConfigService,
    public readonly transaction: {
      transactionId: string;
      userEmail: string;
      amount: number;
      type: 'credit' | 'debit';
    },
    adminEmail?: string,
  ) {
    super(
      configService,
      EmailNotificationEvents.adminNewTransaction,
      'admin-activity-alert',
      'New Transaction Occurred',
      adminEmail,
    );
  }
}

/**
 * Informs an admin that another admin has approved a gift card.
 * Corresponds to your rule: "adminapproveGiftCrad informs admin of approal of giftcard"
 */
export class AdminApproveGiftCardEvent extends AdminEmailEvent {
  constructor(
    configService: ConfigService,
    public readonly approvalInfo: {
      adminId: string;
      cardId: string;
      userEmail: string;
    },
    adminEmail?: string,
  ) {
    super(
      configService,
      EmailNotificationEvents.adminApproveGiftCard,
      'admin-general-notification', // A generic template for informational messages
      'Gift Card Approved',
      adminEmail,
    );
  }
}

/**
 * Informs an admin that another admin has suspended a gift card.
 * Corresponds to your rule: "adminSuspendGiftcard informs admin of giftcard suspension"
 */
export class AdminSuspendGiftCardEvent extends AdminEmailEvent {
  constructor(
    configService: ConfigService,
    public readonly suspensionInfo: {
      adminId: string;
      cardId: string;
      userEmail: string;
      reason: string;
    },
    adminEmail?: string,
  ) {
    super(
      configService,
      EmailNotificationEvents.adminSuspendGiftCard,
      'admin-general-notification',
      'Gift Card Suspended',
      adminEmail,
    );
  }
}

/**
 * Informs an admin about a new push notification that has been broadcasted.
 * Corresponds to your rule: "adminPushNotification informs admin of newpush publication"
 */
export class AdminPushNotificationEvent extends AdminEmailEvent {
  constructor(
    configService: ConfigService,
    public readonly notification: {
      title: string;
      body: string;
      sentByAdminId: string;
    },
    adminEmail?: string,
  ) {
    super(
      configService,
      EmailNotificationEvents.adminPushNotification,
      'admin-general-notification',
      'New Push Notification Published',
      adminEmail,
    );
  }
}
