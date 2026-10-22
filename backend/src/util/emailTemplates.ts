export const getPasswordResetTemplate = (url: string) => ({
  subject: "Reset Your ZFit Password",
  text: `Hi there, you requested to reset your password for your ZFit account. Click this link to create a new password: ${url}. This link will expire in 24 hours for security. If you didn't request this, you can safely ignore this email. Questions? Contact support@zfit.synerge.digital`,
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your ZFit Password</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #000000;
          color: #ffffff;
          line-height: 1.5;
          margin: 0;
          padding: 40px 20px;
        }
        .container {
          max-width: 480px;
          margin: 0 auto;
          background-color: #1a1a1a;
          border-radius: 8px;
          overflow: hidden;
        }
        .header {
          padding: 40px 40px 30px;
          text-align: center;
        }
        .title {
          font-size: 22px;
          font-weight: 500;
          color: #ffffff;
          margin-bottom: 16px;
        }
        .content {
          padding: 0 40px 40px;
        }
        .greeting {
          font-size: 16px;
          color: #ffffff;
          margin-bottom: 16px;
        }
        .message {
          font-size: 15px;
          color: #cccccc;
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .reset-button {
          display: inline-block;
          background-color: #AAFF69;
          color: #000000;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 15px;
          margin-bottom: 32px;
          transition: opacity 0.2s ease;
        }
        .reset-button:hover {
          opacity: 0.9;
        }
        .security-note {
          font-size: 13px;
          color: #999999;
          margin-bottom: 16px;
        }
        .ignore-note {
          font-size: 13px;
          color: #999999;
          margin-bottom: 24px;
        }
        .support {
          font-size: 13px;
          color: #999999;
          text-align: center;
        }
        .support a {
          color: #ffffff;
          text-decoration: none;
        }
        .support a:hover {
          text-decoration: underline;
        }
        .footer {
          padding: 20px 40px;
          text-align: center;
        }
        .footer-text {
          font-size: 11px;
          color: #666666;
          line-height: 1.4;
        }
        .footer-text:not(:last-child) {
          margin-bottom: 6px;
        }
        @media only screen and (max-width: 480px) {
          body {
            padding: 20px 10px;
          }
          .container {
            margin: 0;
          }
          .header, .content, .footer {
            padding-left: 24px;
            padding-right: 24px;
          }
          .title {
            font-size: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">Reset Your Password</div>
        </div>
        
        <div class="content">
          <div class="greeting">Hi there,</div>
          
          <div class="message">
            You requested to reset your password for your ZFit account.
          </div>
          
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${url}" class="reset-button">Reset Password</a>
          </div>
          
          <div class="security-note">
            This link will expire in 24 hours for security.
          </div>
          
          <div class="ignore-note">
            If you didn't request this, you can safely ignore this email.
          </div>
          
          <div class="support">
            Questions? Contact <a href="mailto:support@zfit.synerge.digital">support@zfit.synerge.digital</a>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text">&copy; ${new Date().getFullYear()} ZFit Gym Management System</div>
          <div class="footer-text">18/2, Nawala Road, Rajagiriya, Colombo, Sri Lanka</div>
        </div>
      </div>
    </body>
    </html>
  `,
});

export const getVerifyEmailTemplate = (url: string) => ({
  subject: "Verify Your ZFit Email Address",
  text: `Hi there, please verify your email address for your ZFit account by clicking this link: ${url}. This link will expire in 24 hours for security. Questions? Contact support@zfit.synerge.digital`,
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your ZFit Email Address</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #000000;
          color: #ffffff;
          line-height: 1.5;
          margin: 0;
          padding: 40px 20px;
        }
        .container {
          max-width: 480px;
          margin: 0 auto;
          background-color: #1a1a1a;
          border-radius: 8px;
          overflow: hidden;
        }
        .header {
          padding: 40px 40px 30px;
          text-align: center;
        }
        .title {
          font-size: 22px;
          font-weight: 500;
          color: #ffffff;
          margin-bottom: 16px;
        }
        .content {
          padding: 0 40px 40px;
        }
        .greeting {
          font-size: 16px;
          color: #ffffff;
          margin-bottom: 16px;
        }
        .message {
          font-size: 15px;
          color: #cccccc;
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .verify-button {
          display: inline-block;
          background-color: #AAFF69;
          color: #000000;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 15px;
          margin-bottom: 32px;
          transition: opacity 0.2s ease;
        }
        .verify-button:hover {
          opacity: 0.9;
        }
        .security-note {
          font-size: 13px;
          color: #999999;
          margin-bottom: 24px;
        }
        .support {
          font-size: 13px;
          color: #999999;
          text-align: center;
        }
        .support a {
          color: #ffffff;
          text-decoration: none;
        }
        .support a:hover {
          text-decoration: underline;
        }
        .footer {
          padding: 20px 40px;
          text-align: center;
        }
        .footer-text {
          font-size: 11px;
          color: #666666;
          line-height: 1.4;
        }
        .footer-text:not(:last-child) {
          margin-bottom: 6px;
        }
        @media only screen and (max-width: 480px) {
          body {
            padding: 20px 10px;
          }
          .container {
            margin: 0;
          }
          .header, .content, .footer {
            padding-left: 24px;
            padding-right: 24px;
          }
          .title {
            font-size: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">Verify Your Email Address</div>
        </div>
        
        <div class="content">
          <div class="greeting">Hi there,</div>
          
          <div class="message">
            Please verify your email address to complete your ZFit account setup.
          </div>
          
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${url}" class="verify-button">Verify Email Address</a>
          </div>
          
          <div class="security-note">
            This link will expire in 24 hours for security.
          </div>
          
          <div class="support">
            Questions? Contact <a href="mailto:support@zfit.synerge.digital">support@zfit.synerge.digital</a>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text">&copy; ${new Date().getFullYear()} ZFit Gym Management System</div>
          <div class="footer-text">18/2, Nawala Road, Rajagiriya, Colombo, Sri Lanka</div>
        </div>
      </div>
    </body>
    </html>
  `,
});

export const getWelcomeEmailTemplate = (resetPasswordUrl: string, userName: string) => ({
  subject: "Welcome to ZFit - Set Your Password",
  text: `Welcome to ZFit, ${userName}! Your account has been created successfully. To get started, please set your password by clicking this link: ${resetPasswordUrl}. Questions? Contact support@zfit.synerge.digital`,
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ZFit</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #000000;
          color: #ffffff;
          line-height: 1.5;
          margin: 0;
          padding: 40px 20px;
        }
        .container {
          max-width: 480px;
          margin: 0 auto;
          background-color: #1a1a1a;
          border-radius: 8px;
          overflow: hidden;
        }
        .header {
          padding: 40px 40px 30px;
          text-align: center;
        }
        .title {
          font-size: 22px;
          font-weight: 500;
          color: #ffffff;
          margin-bottom: 16px;
        }
        .content {
          padding: 0 40px 40px;
        }
        .greeting {
          font-size: 16px;
          color: #ffffff;
          margin-bottom: 16px;
        }
        .message {
          font-size: 15px;
          color: #cccccc;
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .welcome-button {
          display: inline-block;
          background-color: #AAFF69;
          color: #000000;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 15px;
          margin-bottom: 32px;
          transition: opacity 0.2s ease;
        }
        .welcome-button:hover {
          opacity: 0.9;
        }
        .features {
          font-size: 13px;
          color: #999999;
          margin-bottom: 24px;
        }
        .support {
          font-size: 13px;
          color: #999999;
          text-align: center;
        }
        .support a {
          color: #ffffff;
          text-decoration: none;
        }
        .support a:hover {
          text-decoration: underline;
        }
        .footer {
          padding: 20px 40px;
          text-align: center;
        }
        .footer-text {
          font-size: 11px;
          color: #666666;
          line-height: 1.4;
        }
        .footer-text:not(:last-child) {
          margin-bottom: 6px;
        }
        @media only screen and (max-width: 480px) {
          body {
            padding: 20px 10px;
          }
          .container {
            margin: 0;
          }
          .header, .content, .footer {
            padding-left: 24px;
            padding-right: 24px;
          }
          .title {
            font-size: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">Welcome to ZFit</div>
        </div>
        
        <div class="content">
          <div class="greeting">Hi ${userName},</div>
          
          <div class="message">
            Welcome to ZFit! Your account has been successfully created. To get started, please set your password by clicking the button below.
          </div>
          
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${resetPasswordUrl}" class="welcome-button">Set Your Password</a>
          </div>
          
          <div class="features">
            Once you're set up, you'll be able to book classes, track your progress, and access all our premium facilities.
          </div>
          
          <div class="support">
            Questions? Contact <a href="mailto:support@zfit.synerge.digital">support@zfit.synerge.digital</a>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text">&copy; ${new Date().getFullYear()} ZFit Gym Management System</div>
          <div class="footer-text">18/2, Nawala Road, Rajagiriya, Colombo, Sri Lanka</div>
        </div>
      </div>
    </body>
    </html>
  `,
});

export interface BankTransferApprovalData {
  userName: string;
  membershipName: string;
  amount: number;
  currency: string;
  transactionId: string;
  approvedDate: string;
  adminNotes?: string | undefined;
}

export const getBankTransferApprovalTemplate = (data: BankTransferApprovalData) => ({
  subject: "Bank Transfer Payment Approved - ZFit Gym",
  text: `Hi ${data.userName}, your bank transfer payment for ${data.membershipName} (${data.currency} ${data.amount}) has been approved. Transaction ID: ${data.transactionId}. Your membership has been activated. Questions? Contact support@zfit.synerge.digital`,
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bank Transfer Approved - ZFit Gym</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #000000;
          color: #ffffff;
          line-height: 1.5;
          margin: 0;
          padding: 40px 20px;
        }
        .container {
          max-width: 480px;
          margin: 0 auto;
          background-color: #1a1a1a;
          border-radius: 8px;
          overflow: hidden;
        }
        .header {
          padding: 40px 40px 30px;
          text-align: center;
        }
        .title {
          font-size: 22px;
          font-weight: 500;
          color: #ffffff;
          margin-bottom: 16px;
        }
        .content {
          padding: 0 40px 40px;
        }
        .greeting {
          font-size: 16px;
          color: #ffffff;
          margin-bottom: 16px;
        }
        .message {
          font-size: 15px;
          color: #cccccc;
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .payment-info {
          background-color: #2a2a2a;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
          text-align: center;
        }
        .access-button {
          display: inline-block;
          background-color: #AAFF69;
          color: #000000;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 15px;
          margin-bottom: 32px;
          transition: opacity 0.2s ease;
        }
        .access-button:hover {
          opacity: 0.9;
        }
        .support {
          font-size: 13px;
          color: #999999;
          text-align: center;
        }
        .support a {
          color: #ffffff;
          text-decoration: none;
        }
        .support a:hover {
          text-decoration: underline;
        }
        .footer {
          padding: 20px 40px;
          text-align: center;
        }
        .footer-text {
          font-size: 11px;
          color: #666666;
          line-height: 1.4;
        }
        .footer-text:not(:last-child) {
          margin-bottom: 6px;
        }
        @media only screen and (max-width: 480px) {
          body {
            padding: 20px 10px;
          }
          .container {
            margin: 0;
          }
          .header, .content, .footer {
            padding-left: 24px;
            padding-right: 24px;
          }
          .title {
            font-size: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">Payment Approved</div>
        </div>
        
        <div class="content">
          <div class="greeting">Hi ${data.userName},</div>
          
          <div class="message">
            Your bank transfer payment has been successfully verified and approved. Your membership is now active.
          </div>
          
          <div class="payment-info">
            <div style="font-size: 18px; font-weight: 500; margin-bottom: 8px;">${data.membershipName}</div>
            <div style="font-size: 16px; color: #AAFF69; font-weight: 500; margin-bottom: 8px;">${data.currency} ${data.amount.toLocaleString()}</div>
            <div style="font-size: 13px; color: #999999;">Transaction: ${data.transactionId}</div>
            <div style="font-size: 13px; color: #999999;">Approved: ${data.approvedDate}</div>
            ${data.adminNotes ? `<div style="font-size: 13px; color: #999999; margin-top: 8px;">Note: ${data.adminNotes}</div>` : ''}
          </div>
          
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/memberDashboard/memberships/my-memberships" class="access-button">Access Dashboard</a>
          </div>
          
          <div class="support">
            Questions? Contact <a href="mailto:support@zfit.synerge.digital">support@zfit.synerge.digital</a>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text">&copy; ${new Date().getFullYear()} ZFit Gym Management System</div>
          <div class="footer-text">18/2, Nawala Road, Rajagiriya, Colombo, Sri Lanka</div>
        </div>
      </div>
    </body>
    </html>
  `,
});

export const getBankTransferDeclineTemplate = (data: BankTransferApprovalData) => ({
  subject: "Bank Transfer Payment Declined - ZFit Gym",
  text: `Hi ${data.userName}, unfortunately your bank transfer payment for ${data.membershipName} (${data.currency} ${data.amount}) has been declined. ${data.adminNotes ? 'Reason: ' + data.adminNotes : ''} Please contact support@zfit.synerge.digital for assistance.`,
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bank Transfer Declined - ZFit Gym</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #000000;
          color: #ffffff;
          line-height: 1.5;
          margin: 0;
          padding: 40px 20px;
        }
        .container {
          max-width: 480px;
          margin: 0 auto;
          background-color: #1a1a1a;
          border-radius: 8px;
          overflow: hidden;
        }
        .header {
          padding: 40px 40px 30px;
          text-align: center;
        }
        .title {
          font-size: 22px;
          font-weight: 500;
          color: #ffffff;
          margin-bottom: 16px;
        }
        .content {
          padding: 0 40px 40px;
        }
        .greeting {
          font-size: 16px;
          color: #ffffff;
          margin-bottom: 16px;
        }
        .message {
          font-size: 15px;
          color: #cccccc;
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .payment-info {
          background-color: #2a2a2a;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
          text-align: center;
        }
        .retry-button {
          display: inline-block;
          background-color: #AAFF69;
          color: #000000;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 15px;
          margin-bottom: 32px;
          transition: opacity 0.2s ease;
        }
        .retry-button:hover {
          opacity: 0.9;
        }
        .support {
          font-size: 13px;
          color: #999999;
          text-align: center;
        }
        .support a {
          color: #ffffff;
          text-decoration: none;
        }
        .support a:hover {
          text-decoration: underline;
        }
        .footer {
          padding: 20px 40px;
          text-align: center;
        }
        .footer-text {
          font-size: 11px;
          color: #666666;
          line-height: 1.4;
        }
        .footer-text:not(:last-child) {
          margin-bottom: 6px;
        }
        @media only screen and (max-width: 480px) {
          body {
            padding: 20px 10px;
          }
          .container {
            margin: 0;
          }
          .header, .content, .footer {
            padding-left: 24px;
            padding-right: 24px;
          }
          .title {
            font-size: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">Payment Declined</div>
        </div>
        
        <div class="content">
          <div class="greeting">Hi ${data.userName},</div>
          
          <div class="message">
            We were unable to approve your bank transfer payment after careful review. Please see the details below.
          </div>
          
          <div class="payment-info">
            <div style="font-size: 18px; font-weight: 500; margin-bottom: 8px;">${data.membershipName}</div>
            <div style="font-size: 16px; color: #AAFF69; font-weight: 500; margin-bottom: 8px;">${data.currency} ${data.amount.toLocaleString()}</div>
            <div style="font-size: 13px; color: #999999;">Transaction: ${data.transactionId}</div>
            <div style="font-size: 13px; color: #999999;">Declined: ${data.approvedDate}</div>
            ${data.adminNotes ? `<div style="font-size: 13px; color: #999999; margin-top: 8px;">Reason: ${data.adminNotes}</div>` : ''}
          </div>
          
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/memberDashboard/memberships/browse" class="retry-button">Submit New Payment</a>
          </div>
          
          <div class="support">
            Need assistance? Contact <a href="mailto:support@zfit.synerge.digital">support@zfit.synerge.digital</a>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text">&copy; ${new Date().getFullYear()} ZFit Gym Management System</div>
          <div class="footer-text">18/2, Nawala Road, Rajagiriya, Colombo, Sri Lanka</div>
        </div>
      </div>
    </body>
    </html>
  `,
});

// Membership Purchase Email Templates

export interface MembershipPurchaseSuccessData {
  userName: string;
  userEmail: string;
  membershipPlanName: string;
  membershipDuration: string;
  amount: number;
  currency: string;
  activationDate: string;
  expiryDate: string;
  transactionId: string;
  paymentMethod: string;
  membershipFeatures: string[];
}

export const getMembershipPurchaseSuccessTemplate = (data: MembershipPurchaseSuccessData) => ({
  subject: "Membership Activated - ZFit",
  text: `Hi ${data.userName}, your ${data.membershipPlanName} membership has been successfully activated! Amount paid: ${data.currency} ${data.amount}. Transaction ID: ${data.transactionId}. Your membership is valid from ${data.activationDate} to ${data.expiryDate}. Questions? Contact support@zfit.synerge.digital`,
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Membership Activated - ZFit</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #000000;
          color: #ffffff;
          line-height: 1.5;
          margin: 0;
          padding: 40px 20px;
        }
        .container {
          max-width: 480px;
          margin: 0 auto;
          background-color: #1a1a1a;
          border-radius: 8px;
          overflow: hidden;
        }
        .header {
          padding: 40px 40px 30px;
          text-align: center;
        }
        .title {
          font-size: 22px;
          font-weight: 500;
          color: #ffffff;
          margin-bottom: 16px;
        }
        .content {
          padding: 0 40px 40px;
        }
        .greeting {
          font-size: 16px;
          color: #ffffff;
          margin-bottom: 16px;
        }
        .message {
          font-size: 15px;
          color: #cccccc;
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .membership-info {
          background-color: #2a2a2a;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
          text-align: center;
        }
        .membership-button {
          display: inline-block;
          background-color: #AAFF69;
          color: #000000;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 15px;
          margin-bottom: 32px;
          transition: opacity 0.2s ease;
        }
        .membership-button:hover {
          opacity: 0.9;
        }
        .support {
          font-size: 13px;
          color: #999999;
          text-align: center;
        }
        .support a {
          color: #ffffff;
          text-decoration: none;
        }
        .support a:hover {
          text-decoration: underline;
        }
        .footer {
          padding: 20px 40px;
          text-align: center;
        }
        .footer-text {
          font-size: 11px;
          color: #666666;
          line-height: 1.4;
        }
        .footer-text:not(:last-child) {
          margin-bottom: 6px;
        }
        @media only screen and (max-width: 480px) {
          body {
            padding: 20px 10px;
          }
          .container {
            margin: 0;
          }
          .header, .content, .footer {
            padding-left: 24px;
            padding-right: 24px;
          }
          .title {
            font-size: 20px;
          }
        }
        .membership-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer 3s infinite;
        }
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        .membership-name {
          font-size: 22px;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .membership-amount {
          font-size: 28px;
          margin: 10px 0;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .membership-duration {
          font-size: 16px;
          opacity: 0.8;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: linear-gradient(145deg, #1a1a1a 0%, #2a2a2a 100%);
          border: 1px solid #404040;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .details-table tr:nth-child(even) {
          background: linear-gradient(145deg, #2a2a2a 0%, #252525 100%);
        }
        .details-table tr:nth-child(odd) {
          background: linear-gradient(145deg, #252525 0%, #2a2a2a 100%);
        }
        .details-table td {
          padding: 15px 20px;
          border-bottom: 1px solid #333;
          font-size: 15px;
        }
        .details-table .label {
          color: #aaaaaa;
          font-weight: 600;
          width: 35%;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.5px;
        }
        .details-table .value {
          color: #ffffff;
          font-weight: 500;
        }
        .features-section {
          background: linear-gradient(145deg, #252525 0%, #1a1a1a 100%);
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border: 1px solid #404040;
        }
        .features-title {
          color: #AAFF69;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 15px;
          text-align: center;
        }
        .features-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .features-list li {
          padding: 8px 0;
          color: #e0e0e0;
          border-bottom: 1px solid #333;
        }
        .features-list li:last-child {
          border-bottom: none;
        }
        .features-list li:before {
          content: "✓";
          color: #AAFF69;
          font-weight: bold;
          margin-right: 10px;
        }
        .cta-section {
          text-align: center;
          margin: 25px 0;
        }
        .cta-button {
          display: inline-block;
          padding: 16px 32px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 700;
          font-size: 16px;
          text-align: center;
          margin: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          background: linear-gradient(135deg, #AAFF69 0%, #7BC96F 100%);
          color: #000;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(170, 255, 105, 0.4);
        }
        .support-section {
          background: linear-gradient(145deg, #1a1a1a 0%, #252525 100%);
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
          border: 1px solid #404040;
        }
        .footer {
          text-align: center;
          padding: 20px;
          background: linear-gradient(145deg, #1a1a1a 0%, #252525 100%);
          border-top: 1px solid #404040;
          font-size: 13px;
          color: #888;
        }
        .footer a {
          color: #AAFF69;
          text-decoration: none;
          font-weight: 500;
        }
        .footer a:hover {
          color: #7BC96F;
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">Membership Activated</div>
        </div>
        
        <div class="content">
          <div class="greeting">Hi ${data.userName},</div>

          <div class="message">
            Your ${data.membershipPlanName} membership has been successfully activated.
          </div>
          
          <div class="membership-info">
            <div style="font-size: 18px; font-weight: 500; margin-bottom: 8px;">${data.membershipPlanName}</div>
            <div style="font-size: 16px; color: #AAFF69; font-weight: 500;">${data.currency} ${data.amount}</div>
            <div style="font-size: 14px; color: #999999; margin-top: 8px;">Valid: ${data.activationDate} - ${data.expiryDate}</div>
            <div style="font-size: 13px; color: #999999; margin-top: 4px;">Transaction: ${data.transactionId}</div>
          </div>

          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${process.env.FRONTEND_APP_ORIGIN || 'http://localhost:3000'}/memberDashboard" class="membership-button">Access Dashboard</a>
          </div>

          <div class="support">
            Questions? Contact <a href="mailto:support@zfit.synerge.digital">support@zfit.synerge.digital</a>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text">&copy; ${new Date().getFullYear()} ZFit Gym Management System</div>
          <div class="footer-text">18/2, Nawala Road, Rajagiriya, Colombo, Sri Lanka</div>
        </div>
      </div>
    </body>
    </html>
  `,
});

export interface MembershipPurchaseFailureData {
  userName: string;
  userEmail: string;
  membershipPlanName: string;
  amount: number;
  currency: string;
  transactionId: string;
  failureReason: string;
  retryUrl: string;
}

export const getMembershipPurchaseFailureTemplate = (data: MembershipPurchaseFailureData) => ({
  subject: "Payment Issue - ZFit Membership",
  text: `Hi ${data.userName}, we encountered an issue processing your payment for ${data.membershipPlanName} (${data.currency} ${data.amount}). Reason: ${data.failureReason}. Transaction ID: ${data.transactionId}. Please try again or contact support@zfit.synerge.digital for assistance.`,
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Issue - ZFit Gym</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
          color: #ffffff;
        }
        .container {
          max-width: 650px;
          margin: 0 auto;
          background: linear-gradient(145deg, #2a2a2a 0%, #1e1e1e 100%);
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          overflow: hidden;
        }
        .email-body {
          padding: 30px;
        }
        .header-section {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #404040;
          position: relative;
        }
        .header-section::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, #AAFF69 0%, #7BC96F 100%);
        }
        .logo-area {
          font-size: 28px;
          font-weight: 800;
          color: #AAFF69;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(170, 255, 105, 0.3);
          letter-spacing: 2px;
        }
        .status-icon {
          font-size: 48px;
          margin: 15px 0;
          color: #ef4444;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }
        .main-title {
          font-size: 26px;
          font-weight: 700;
          margin: 12px 0;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .greeting {
          font-size: 18px;
          color: #cccccc;
          margin: 20px 0 12px 0;
          font-weight: 400;
        }
        .message {
          font-size: 16px;
          line-height: 1.6;
          color: #e0e0e0;
          margin: 12px 0;
          font-weight: 400;
        }
        .error-box {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: #fff;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          margin: 20px 0;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);
        }
        .error-reason {
          font-size: 16px;
          margin-top: 10px;
          opacity: 0.9;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: linear-gradient(145deg, #1a1a1a 0%, #2a2a2a 100%);
          border: 1px solid #404040;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .details-table tr:nth-child(even) {
          background: linear-gradient(145deg, #2a2a2a 0%, #252525 100%);
        }
        .details-table tr:nth-child(odd) {
          background: linear-gradient(145deg, #252525 0%, #2a2a2a 100%);
        }
        .details-table td {
          padding: 15px 20px;
          border-bottom: 1px solid #333;
          font-size: 15px;
        }
        .details-table .label {
          color: #aaaaaa;
          font-weight: 600;
          width: 35%;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.5px;
        }
        .details-table .value {
          color: #ffffff;
          font-weight: 500;
        }
        .cta-button {
          display: inline-block;
          padding: 16px 32px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 700;
          font-size: 16px;
          text-align: center;
          margin: 20px 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          background: linear-gradient(135deg, #AAFF69 0%, #7BC96F 100%);
          color: #000;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(170, 255, 105, 0.4);
        }
        .cta-button-secondary {
          background: linear-gradient(135deg, #404040 0%, #525252 100%);
          color: #ffffff;
        }
        .help-section {
          background: linear-gradient(145deg, #1a1a1a 0%, #252525 100%);
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border: 1px solid #404040;
        }
        .help-title {
          color: #AAFF69;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        .help-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .help-list li {
          padding: 5px 0;
          color: #e0e0e0;
        }
        .help-list li:before {
          content: "→";
          color: #AAFF69;
          font-weight: bold;
          margin-right: 10px;
        }
        .footer {
          text-align: center;
          padding: 20px;
          background: linear-gradient(145deg, #1a1a1a 0%, #252525 100%);
          border-top: 1px solid #404040;
          font-size: 13px;
          color: #888;
        }
        .footer a {
          color: #AAFF69;
          text-decoration: none;
          font-weight: 500;
        }
        .footer a:hover {
          color: #7BC96F;
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-body">
          <div class="header-section">
            <div class="logo-area">ZFit</div>
            <div class="status-icon">⚠️</div>
            <div class="main-title">Payment Issue</div>
          </div>

          <div class="greeting">Hi <strong style="color: #AAFF69;">${data.userName}</strong>,</div>

          <div class="message">
            We encountered an issue while processing your payment for the <strong>${data.membershipPlanName}</strong> membership. Don't worry - no charges have been made to your account.
          </div>

          <div class="error-box">
            <div>Payment Failed</div>
            <div class="error-reason">${data.failureReason}</div>
          </div>

          <table class="details-table">
            <tr>
              <td class="label">Membership Plan</td>
              <td class="value">${data.membershipPlanName}</td>
            </tr>
            <tr>
              <td class="label">Amount</td>
              <td class="value">${data.currency} ${data.amount}</td>
            </tr>
            <tr>
              <td class="label">Transaction ID</td>
              <td class="value">${data.transactionId}</td>
            </tr>
          </table>

          <div style="text-align: center; margin: 25px 0;">
            <a href="${data.retryUrl}" class="cta-button">
              Try Payment Again
            </a>
            <a href="${process.env.FRONTEND_APP_ORIGIN || 'http://localhost:3000'}/memberDashboard/memberships/browse" class="cta-button cta-button-secondary">
              Browse Other Plans
            </a>
          </div>

          <div class="help-section">
            <div class="help-title">Common Solutions:</div>
            <ul class="help-list">
              <li>Check that your card details are correct</li>
              <li>Ensure your card has sufficient funds</li>
              <li>Try a different payment method</li>
              <li>Contact your bank if the issue persists</li>
            </ul>
          </div>

          <div class="message" style="text-align: center; margin-top: 20px;">
            Need assistance? Our support team is ready to help at <a href="mailto:support@zfit.com" style="color: #AAFF69; font-weight: 600;">support@zfit.com</a>
          </div>
        </div>

        <div class="footer">
          <div style="margin-bottom: 10px; font-weight: 600;">&copy; ${new Date().getFullYear()} ZFit Gym Management System</div>
          <div>
            <a href="#">Privacy Policy</a> • <a href="#">Terms of Service</a> • <a href="#">Unsubscribe</a>
          </div>
          <div style="margin-top: 10px; font-size: 11px; color: #666;">
            123 Fitness Street, Colombo, Sri Lanka
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
});

// Cart Purchase Email Templates

export interface CartPurchaseSuccessData {
  userName: string;
  userEmail: string;
  orderNumber: string;
  items: Array<{
    itemName: string;
    quantity: number;
    price: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  currency: string;
  orderDate: string;
  transactionId: string;
  paymentMethod: string;
}

export const getCartPurchaseSuccessTemplate = (data: CartPurchaseSuccessData) => ({
  subject: "Order Confirmed - ZFit Store",
  text: `Hi ${data.userName}, your order (#${data.orderNumber}) has been successfully placed! Total: ${data.currency} ${data.totalAmount}. Transaction ID: ${data.transactionId}. Your items will be available for pickup or delivery soon. Questions? Contact support@zfit.synerge.digital`,
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmed - ZFit Store</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #000000;
          color: #ffffff;
          line-height: 1.5;
          margin: 0;
          padding: 40px 20px;
        }
        .container {
          max-width: 480px;
          margin: 0 auto;
          background-color: #1a1a1a;
          border-radius: 8px;
          overflow: hidden;
        }
        .header {
          padding: 40px 40px 30px;
          text-align: center;
        }
        .title {
          font-size: 22px;
          font-weight: 500;
          color: #ffffff;
          margin-bottom: 16px;
        }
        .content {
          padding: 0 40px 40px;
        }
        .greeting {
          font-size: 16px;
          color: #ffffff;
          margin-bottom: 16px;
        }
        .message {
          font-size: 15px;
          color: #cccccc;
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .order-info {
          background-color: #2a2a2a;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .order-button {
          display: inline-block;
          background-color: #AAFF69;
          color: #000000;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 15px;
          margin-bottom: 32px;
          transition: opacity 0.2s ease;
        }
        .order-button:hover {
          opacity: 0.9;
        }
        .support {
          font-size: 13px;
          color: #999999;
          text-align: center;
        }
        .support a {
          color: #ffffff;
          text-decoration: none;
        }
        .support a:hover {
          text-decoration: underline;
        }
        .footer {
          padding: 20px 40px;
          text-align: center;
        }
        .footer-text {
          font-size: 11px;
          color: #666666;
          line-height: 1.4;
        }
        .footer-text:not(:last-child) {
          margin-bottom: 6px;
        }
        @media only screen and (max-width: 480px) {
          body {
            padding: 20px 10px;
          }
          .container {
            margin: 0;
          }
          .header, .content, .footer {
            padding-left: 24px;
            padding-right: 24px;
          }
          .title {
            font-size: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">Order Confirmed</div>
        </div>
        
        <div class="content">
          <div class="greeting">Hi ${data.userName},</div>
          
          <div class="message">
            Your order has been successfully placed and is being processed. Thank you for shopping with ZFit Store!
          </div>
          
          <div class="order-info">
            <div style="font-size: 18px; font-weight: 500; margin-bottom: 8px;">Order #${data.orderNumber}</div>
            <div style="font-size: 16px; color: #AAFF69; font-weight: 500; margin-bottom: 8px;">${data.currency} ${data.totalAmount.toFixed(2)}</div>
            <div style="font-size: 14px; color: #999999; margin-bottom: 4px;">Order Date: ${data.orderDate}</div>
            <div style="font-size: 13px; color: #999999; margin-bottom: 4px;">Transaction: ${data.transactionId}</div>
            <div style="font-size: 13px; color: #999999;">Payment: ${data.paymentMethod}</div>
            ${data.items && data.items.length > 0 ? `
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #404040;">
                <div style="font-size: 14px; color: #cccccc; margin-bottom: 8px;">Items:</div>
                ${data.items.map(item => `
                  <div style="font-size: 13px; color: #999999; margin-bottom: 4px;">
                    ${item.itemName} × ${item.quantity} - ${data.currency} ${item.totalPrice.toFixed(2)}
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${process.env.FRONTEND_APP_ORIGIN || 'http://localhost:3000'}/memberDashboard/orders" class="order-button">View Order Details</a>
          </div>
          
          <div class="support">
            Questions? Contact <a href="mailto:support@zfit.synerge.digital">support@zfit.synerge.digital</a>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text">&copy; ${new Date().getFullYear()} ZFit Gym Management System</div>
          <div class="footer-text">18/2, Nawala Road, Rajagiriya, Colombo, Sri Lanka</div>
        </div>
      </div>
    </body>
    </html>
  `,
});

export interface CartPurchaseFailureData {
  userName: string;
  userEmail: string;
  orderNumber: string;
  totalAmount: number;
  currency: string;
  transactionId: string;
  failureReason: string;
  retryUrl: string;
}

export const getCartPurchaseFailureTemplate = (data: CartPurchaseFailureData) => ({
  subject: "Order Payment Issue - ZFit Store",
  text: `Hi ${data.userName}, we encountered an issue processing your order payment (#${data.orderNumber}) for ${data.currency} ${data.totalAmount}. Reason: ${data.failureReason}. Transaction ID: ${data.transactionId}. Please try again or contact support@zfit.synerge.digital for assistance.`,
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Payment Issue - ZFit Store</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #000000;
          color: #ffffff;
          line-height: 1.5;
          margin: 0;
          padding: 40px 20px;
        }
        .container {
          max-width: 480px;
          margin: 0 auto;
          background-color: #1a1a1a;
          border-radius: 8px;
          overflow: hidden;
        }
        .header {
          padding: 40px 40px 30px;
          text-align: center;
        }
        .title {
          font-size: 22px;
          font-weight: 500;
          color: #ffffff;
          margin-bottom: 16px;
        }
        .content {
          padding: 0 40px 40px;
        }
        .greeting {
          font-size: 16px;
          color: #ffffff;
          margin-bottom: 16px;
        }
        .message {
          font-size: 15px;
          color: #cccccc;
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .error-info {
          background-color: #2a2a2a;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
          text-align: center;
        }
        .retry-button {
          display: inline-block;
          background-color: #AAFF69;
          color: #000000;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 15px;
          margin-bottom: 32px;
          transition: opacity 0.2s ease;
        }
        .retry-button:hover {
          opacity: 0.9;
        }
        .support {
          font-size: 13px;
          color: #999999;
          text-align: center;
        }
        .support a {
          color: #ffffff;
          text-decoration: none;
        }
        .support a:hover {
          text-decoration: underline;
        }
        .footer {
          padding: 20px 40px;
          text-align: center;
        }
        .footer-text {
          font-size: 11px;
          color: #666666;
          line-height: 1.4;
        }
        .footer-text:not(:last-child) {
          margin-bottom: 6px;
        }
        @media only screen and (max-width: 480px) {
          body {
            padding: 20px 10px;
          }
          .container {
            margin: 0;
          }
          .header, .content, .footer {
            padding-left: 24px;
            padding-right: 24px;
          }
          .title {
            font-size: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">Order Payment Issue</div>
        </div>
        
        <div class="content">
          <div class="greeting">Hi ${data.userName},</div>
          
          <div class="message">
            We encountered an issue while processing your order payment. Don't worry - no charges have been made and your cart items are still saved.
          </div>
          
          <div class="error-info">
            <div style="font-size: 16px; font-weight: 500; margin-bottom: 8px;">Order #${data.orderNumber}</div>
            <div style="font-size: 16px; color: #AAFF69; font-weight: 500; margin-bottom: 8px;">${data.currency} ${data.totalAmount.toFixed(2)}</div>
            <div style="font-size: 14px; color: #999999; margin-bottom: 8px;">Reason: ${data.failureReason}</div>
            <div style="font-size: 13px; color: #999999;">Transaction: ${data.transactionId}</div>
          </div>
          
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${data.retryUrl}" class="retry-button">Try Payment Again</a>
          </div>
          
          <div class="support">
            Questions? Contact <a href="mailto:support@zfit.synerge.digital">support@zfit.synerge.digital</a>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-text">&copy; ${new Date().getFullYear()} ZFit Gym Management System</div>
          <div class="footer-text">18/2, Nawala Road, Rajagiriya, Colombo, Sri Lanka</div>
        </div>
      </div>
    </body>
    </html>
  `,
});

// Refund email interfaces
export interface RefundApprovalData {
  userName: string;
  requestId: string;
  requestedAmount: number;
  currency: string;
  originalPaymentId: string;
  paymentType: string; // 'membership' | 'cart'
  approvedDate: string;
  adminNotes?: string;
}

export interface RefundDeclineData {
  userName: string;
  requestId: string;
  requestedAmount: number;
  currency: string;
  declinedDate: string;
  adminNotes?: string;
  declineReason: string;
}

// Refund approval email template
export const getRefundApprovalTemplate = (data: RefundApprovalData) => ({
  subject: "Refund Request Approved - ZFit Gym",
  text: `Hi ${data.userName}, your refund request #${data.requestId} for ${data.currency} ${data.requestedAmount} has been approved. The refund will be processed within 5-7 business days.${data.adminNotes ? ` Admin note: ${data.adminNotes}` : ''}`,
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Refund Request Approved - ZFit Gym</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
          color: #ffffff;
        }
        .container {
          max-width: 650px;
          margin: 0 auto;
          background: linear-gradient(145deg, #2a2a2a 0%, #1e1e1e 100%);
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          overflow: hidden;
        }
        .email-body {
          padding: 30px;
        }
        .header-section {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #404040;
          position: relative;
        }
        .header-section::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, #AAFF69 0%, #7BC96F 100%);
        }
        .logo-area {
          font-size: 28px;
          font-weight: 800;
          color: #AAFF69;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(170, 255, 105, 0.3);
        }
        .status-badge {
          display: inline-block;
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 10px;
        }
        .main-title {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          margin: 25px 0 15px 0;
          text-align: center;
        }
        .greeting {
          font-size: 16px;
          color: #cccccc;
          margin-bottom: 25px;
          text-align: center;
        }
        .refund-details {
          background: linear-gradient(135deg, #3a3a3a 0%, #2d2d2d 100%);
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          border-left: 4px solid #AAFF69;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          padding: 8px 0;
          border-bottom: 1px solid #404040;
        }
        .detail-row:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        .detail-label {
          color: #aaaaaa;
          font-weight: 500;
        }
        .detail-value {
          color: #ffffff;
          font-weight: 600;
        }
        .amount-highlight {
          color: #AAFF69;
          font-size: 18px;
          font-weight: 700;
        }
        .message {
          background: linear-gradient(135deg, #1a4d2e 0%, #0f3321 100%);
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          border-left: 4px solid #AAFF69;
        }
        .message-title {
          font-size: 16px;
          font-weight: 600;
          color: #AAFF69;
          margin-bottom: 10px;
        }
        .admin-note {
          background: linear-gradient(135deg, #404040 0%, #333333 100%);
          border-radius: 8px;
          padding: 15px;
          margin: 15px 0;
          border-left: 4px solid #ffc107;
        }
        .admin-note-title {
          font-size: 14px;
          font-weight: 600;
          color: #ffc107;
          margin-bottom: 8px;
        }
        .footer {
          text-align: center;
          padding: 20px 0;
          border-top: 2px solid #404040;
          margin-top: 30px;
        }
        .footer a {
          color: #AAFF69;
          text-decoration: none;
          margin: 0 8px;
        }
        .footer a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-body">
          <div class="header-section">
            <div class="logo-area">ZFit</div>
            <div style="color: #888; font-size: 14px;">Gym Management System</div>
            <div class="status-badge">✅ Approved</div>
          </div>

          <div class="main-title">Refund Request Approved!</div>
          <div class="greeting">Hi ${data.userName},</div>

          <div class="message">
            <div class="message-title">Good News!</div>
            Your refund request has been approved by our admin team. The refund will be processed and credited back to your original payment method within 5-7 business days.
          </div>

          <div class="refund-details">
            <div class="detail-row">
              <span class="detail-label">Request ID:</span>
              <span class="detail-value">#${data.requestId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Refund Amount:</span>
              <span class="detail-value amount-highlight">${data.currency} ${data.requestedAmount.toFixed(2)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Original Payment:</span>
              <span class="detail-value">#${data.originalPaymentId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Type:</span>
              <span class="detail-value">${data.paymentType === 'membership' ? 'Membership' : 'Store Purchase'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Approved Date:</span>
              <span class="detail-value">${data.approvedDate}</span>
            </div>
          </div>

          ${data.adminNotes ? `
          <div class="admin-note">
            <div class="admin-note-title">Admin Note:</div>
            <div style="color: #cccccc; line-height: 1.5;">${data.adminNotes}</div>
          </div>
          ` : ''}

          <div class="message">
            <div class="message-title">What happens next?</div>
            <ul style="color: #cccccc; line-height: 1.6; margin: 10px 0; padding-left: 20px;">
              <li>Your refund is now being processed</li>
              <li>You'll receive the refund in your original payment method</li>
              <li>Processing time: 5-7 business days</li>
              <li>You'll receive a confirmation once the refund is completed</li>
            </ul>
          </div>

          <div class="footer">
            <div style="margin-bottom: 10px; font-weight: 600;">&copy; ${new Date().getFullYear()} ZFit Gym Management System</div>
            <div>
              <a href="#">Privacy Policy</a> • <a href="#">Terms of Service</a> • <a href="#">Contact Support</a>
            </div>
            <div style="margin-top: 10px; font-size: 11px; color: #666;">
              Questions? Our support team is here to help at <a href="mailto:support@zfit.synerge.digital" style="color: #AAFF69; font-weight: 600;">support@zfit.synerge.digital</a>
            </div>
            <div style="margin-top: 10px; font-size: 11px; color: #666;">
              18/2, Nawala Road, Rajagiriya, Colombo, Sri Lanka
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
});

// Refund decline email template
export const getRefundDeclineTemplate = (data: RefundDeclineData) => ({
  subject: "Refund Request Update - ZFit Gym",
  text: `Hi ${data.userName}, we've reviewed your refund request #${data.requestId} for ${data.currency} ${data.requestedAmount}. Unfortunately, we cannot process this refund at this time. Reason: ${data.declineReason}${data.adminNotes ? ` Admin note: ${data.adminNotes}` : ''}`,
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Refund Request Update - ZFit Gym</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
          color: #ffffff;
        }
        .container {
          max-width: 650px;
          margin: 0 auto;
          background: linear-gradient(145deg, #2a2a2a 0%, #1e1e1e 100%);
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          overflow: hidden;
        }
        .email-body {
          padding: 30px;
        }
        .header-section {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #404040;
          position: relative;
        }
        .header-section::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, #AAFF69 0%, #7BC96F 100%);
        }
        .logo-area {
          font-size: 28px;
          font-weight: 800;
          color: #AAFF69;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(170, 255, 105, 0.3);
        }
        .status-badge {
          display: inline-block;
          background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 10px;
        }
        .main-title {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          margin: 25px 0 15px 0;
          text-align: center;
        }
        .greeting {
          font-size: 16px;
          color: #cccccc;
          margin-bottom: 25px;
          text-align: center;
        }
        .refund-details {
          background: linear-gradient(135deg, #3a3a3a 0%, #2d2d2d 100%);
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          border-left: 4px solid #dc3545;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          padding: 8px 0;
          border-bottom: 1px solid #404040;
        }
        .detail-row:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        .detail-label {
          color: #aaaaaa;
          font-weight: 500;
        }
        .detail-value {
          color: #ffffff;
          font-weight: 600;
        }
        .amount-highlight {
          color: #dc3545;
          font-size: 18px;
          font-weight: 700;
        }
        .message {
          background: linear-gradient(135deg, #4a1f1f 0%, #331515 100%);
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          border-left: 4px solid #dc3545;
        }
        .message-title {
          font-size: 16px;
          font-weight: 600;
          color: #ff6b6b;
          margin-bottom: 10px;
        }
        .reason-box {
          background: linear-gradient(135deg, #5a2d2d 0%, #4a2424 100%);
          border-radius: 8px;
          padding: 15px;
          margin: 15px 0;
          border-left: 4px solid #ffc107;
        }
        .reason-title {
          font-size: 14px;
          font-weight: 600;
          color: #ffc107;
          margin-bottom: 8px;
        }
        .admin-note {
          background: linear-gradient(135deg, #404040 0%, #333333 100%);
          border-radius: 8px;
          padding: 15px;
          margin: 15px 0;
          border-left: 4px solid #ffc107;
        }
        .admin-note-title {
          font-size: 14px;
          font-weight: 600;
          color: #ffc107;
          margin-bottom: 8px;
        }
        .help-section {
          background: linear-gradient(135deg, #1a4d3a 0%, #0f3328 100%);
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          border-left: 4px solid #AAFF69;
        }
        .help-title {
          font-size: 16px;
          font-weight: 600;
          color: #AAFF69;
          margin-bottom: 10px;
        }
        .footer {
          text-align: center;
          padding: 20px 0;
          border-top: 2px solid #404040;
          margin-top: 30px;
        }
        .footer a {
          color: #AAFF69;
          text-decoration: none;
          margin: 0 8px;
        }
        .footer a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-body">
          <div class="header-section">
            <div class="logo-area">ZFit</div>
            <div style="color: #888; font-size: 14px;">Gym Management System</div>
            <div class="status-badge">❌ Declined</div>
          </div>

          <div class="main-title">Refund Request Update</div>
          <div class="greeting">Hi ${data.userName},</div>

          <div class="message">
            <div class="message-title">Refund Request Status</div>
            We've carefully reviewed your refund request, and unfortunately, we cannot process this refund at this time. Please see the details below for more information.
          </div>

          <div class="refund-details">
            <div class="detail-row">
              <span class="detail-label">Request ID:</span>
              <span class="detail-value">#${data.requestId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Requested Amount:</span>
              <span class="detail-value amount-highlight">${data.currency} ${data.requestedAmount.toFixed(2)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Declined Date:</span>
              <span class="detail-value">${data.declinedDate}</span>
            </div>
          </div>

          <div class="reason-box">
            <div class="reason-title">Reason for Decline:</div>
            <div style="color: #cccccc; line-height: 1.5;">${data.declineReason}</div>
          </div>

          ${data.adminNotes ? `
          <div class="admin-note">
            <div class="admin-note-title">Additional Information:</div>
            <div style="color: #cccccc; line-height: 1.5;">${data.adminNotes}</div>
          </div>
          ` : ''}

          <div class="help-section">
            <div class="help-title">Need Help or Have Questions?</div>
            <div style="color: #cccccc; line-height: 1.6; margin: 10px 0;">
              If you believe this decision was made in error or if you have questions about this refund request, please don't hesitate to:
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Contact our support team directly</li>
                <li>Visit our gym location to speak with management</li>
                <li>Submit additional documentation if applicable</li>
                <li>Request a review of your refund request</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <div style="margin-bottom: 10px; font-weight: 600;">&copy; ${new Date().getFullYear()} ZFit Gym Management System</div>
            <div>
              <a href="#">Privacy Policy</a> • <a href="#">Terms of Service</a> • <a href="#">Contact Support</a>
            </div>
            <div style="margin-top: 10px; font-size: 11px; color: #666;">
              Questions? Our support team is here to help at <a href="mailto:support@zfit.synerge.digital" style="color: #AAFF69; font-weight: 600;">support@zfit.synerge.digital</a>
            </div>
            <div style="margin-top: 10px; font-size: 11px; color: #666;">
              18/2, Nawala Road, Rajagiriya, Colombo, Sri Lanka
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
});