const User = require("../../models/authentication/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");


const { hashPassword, comparePassword } = require("../../utils/bcryptUtils");
const { generateToken, verifyToken } = require("../../utils/jwtUtils");
const { sendEmail } = require("../../utils/emailUtils");

// ---------- REGISTER ----------
exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;



    // check if user exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password if manual registration
    const hashedPassword = password ? await hashPassword(password) : null;

    const user = await User.create({
      email,
      password: hashedPassword,
      role,
      isVerified: false,
      
    });

    // create verification token (short expiry)
    const verifyToken = generateToken(user);

    const verifyLink = `${process.env.CLIENT_URL}/api/auth/verify-email/${verifyToken}`;

    await sendEmail(
      user.email,
      "Verify Your Email",
      `<p>Click <a href="${verifyLink}">here</a> to verify your account.</p>`
    );

    res.status(201).json({
      message: "User registered successfully. Please check your email to verify.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------- VERIFY EMAIL ----------
// ---------- VERIFY EMAIL ----------
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invalid Token - CampRider</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                    background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: #1f2937;
                    line-height: 1.6;
                    padding: 20px;
                }

                .error-container {
                    background: white;
                    padding: 3rem;
                    border-radius: 20px;
                    text-align: center;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    border: 1px solid #e5e7eb;
                    max-width: 480px;
                    width: 100%;
                    animation: fadeInUp 0.6s ease-out;
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .error-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    border-radius: 50%;
                    margin: 0 auto 1.5rem;
                    color: white;
                }

                h1 {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #dc2626;
                    margin-bottom: 1rem;
                }

                .subtitle {
                    font-size: 1.125rem;
                    color: #6b7280;
                    margin-bottom: 2rem;
                }

                .btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    background: linear-gradient(135deg, #059669 0%, #047857 100%);
                    color: white;
                    text-decoration: none;
                    padding: 1rem 2rem;
                    border-radius: 12px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }

                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px -3px rgba(5, 150, 105, 0.4);
                }

                @media (max-width: 480px) {
                    .error-container {
                        padding: 2rem 1.5rem;
                    }
                    
                    h1 {
                        font-size: 1.5rem;
                    }
                }
            </style>
        </head>
        <body>
            <div class="error-container">
                <div class="error-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="40" height="40">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                    </svg>
                </div>
                
                <h1>Invalid or Expired Link</h1>
                <p class="subtitle">Please try registering again or request a new verification email.</p>
                
                <a href="https://camprider.app/register" class="btn">
                    Register Again
                </a>
            </div>
        </body>
        </html>
      `);
    }

    // mark verified
    user.isVerified = true;
    await user.save();

    // return success page
    res.status(200).send(`
      <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verified - CampRider</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #1f2937;
            line-height: 1.6;
            padding: 20px;
        }

        .verification-container {
            background: white;
            padding: 3rem;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid #e5e7eb;
            max-width: 480px;
            width: 100%;
            animation: fadeInUp 0.6s ease-out;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .success-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border-radius: 50%;
            margin: 0 auto 1.5rem;
            color: white;
            animation: scaleIn 0.5s ease-out 0.2s both;
        }

        @keyframes scaleIn {
            from {
                transform: scale(0);
                opacity: 0;
            }
            to {
                transform: scale(1);
                opacity: 1;
            }
        }

        .success-icon svg {
            width: 40px;
            height: 40px;
        }

        h1 {
            font-size: 2rem;
            font-weight: 700;
            color: #059669;
            margin-bottom: 1rem;
            line-height: 1.2;
        }

        .subtitle {
            font-size: 1.125rem;
            color: #6b7280;
            margin-bottom: 2rem;
            font-weight: 500;
        }

        .features {
            background: #f9fafb;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            text-align: left;
        }

        .features h3 {
            font-size: 1rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 1rem;
            text-align: center;
        }

        .feature-list {
            list-style: none;
            display: grid;
            gap: 0.75rem;
        }

        .feature-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 0.875rem;
            color: #4b5563;
        }

        .feature-item::before {
            content: "✓";
            color: #059669;
            font-weight: bold;
            background: #d1fae5;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            flex-shrink: 0;
        }

        .login-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            color: white;
            text-decoration: none;
            padding: 1rem 2rem;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            width: 100%;
            max-width: 200px;
            margin: 0 auto;
        }

        .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px -3px rgba(5, 150, 105, 0.4);
        }

        .login-btn:active {
            transform: translateY(0);
        }

        .camp-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
            color: #059669;
            font-weight: 700;
            font-size: 1.25rem;
        }

        .camp-logo svg {
            width: 24px;
            height: 24px;
        }

        @media (max-width: 480px) {
            .verification-container {
                padding: 2rem 1.5rem;
            }
            
            h1 {
                font-size: 1.5rem;
            }
            
            .subtitle {
                font-size: 1rem;
            }
            
            .success-icon {
                width: 60px;
                height: 60px;
            }
            
            .success-icon svg {
                width: 30px;
                height: 30px;
            }
        }
    </style>
</head>
<body>
    <div class="verification-container">
        <div class="camp-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            CampRider
        </div>
        
        <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5"/>
            </svg>
        </div>
        
        <h1>Email Verified Successfully!</h1>
        <p class="subtitle">Your account is now active and ready to use</p>
        
        <div class="features">
            <h3>You can now:</h3>
            <ul class="feature-list">
                <li class="feature-item">Login to your account</li>
                <li class="feature-item">Book rides around campus</li>
                <li class="feature-item">Access all CampRider features</li>
                <li class="feature-item">Update your profile information</li>
            </ul>
        </div>
        
        <a href="https://camprider.app/login" class="login-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
            </svg>
            Go to Login
        </a>
    </div>
</body>
</html>
    `);
  } catch (err) {
    console.error(err);
    res.status(400).send(`
      <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Failed - CampRider</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #1f2937;
            line-height: 1.6;
            padding: 20px;
        }

        .error-container {
            background: white;
            padding: 3rem;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid #e5e7eb;
            max-width: 480px;
            width: 100%;
            animation: fadeInUp 0.6s ease-out;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .error-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            border-radius: 50%;
            margin: 0 auto 1.5rem;
            color: white;
            animation: shake 0.5s ease-out;
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }

        .error-icon svg {
            width: 40px;
            height: 40px;
        }

        h1 {
            font-size: 2rem;
            font-weight: 700;
            color: #dc2626;
            margin-bottom: 1rem;
            line-height: 1.2;
        }

        .subtitle {
            font-size: 1.125rem;
            color: #6b7280;
            margin-bottom: 2rem;
            font-weight: 500;
        }

        .error-details {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            text-align: left;
        }

        .error-details h3 {
            font-size: 1rem;
            font-weight: 600;
            color: #dc2626;
            margin-bottom: 1rem;
            text-align: center;
        }

        .issue-list {
            list-style: none;
            display: grid;
            gap: 0.75rem;
        }

        .issue-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 0.875rem;
            color: #7f1d1d;
        }

        .issue-item::before {
            content: "!";
            color: #dc2626;
            font-weight: bold;
            background: #fecaca;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            flex-shrink: 0;
        }

        .action-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.875rem 1.5rem;
            border-radius: 10px;
            font-weight: 600;
            font-size: 0.875rem;
            text-decoration: none;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            min-width: 140px;
        }

        .btn-primary {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px -3px rgba(5, 150, 105, 0.4);
        }

        .btn-secondary {
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
        }

        .btn-secondary:hover {
            background: #e5e7eb;
            transform: translateY(-2px);
        }

        .camp-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
            color: #dc2626;
            font-weight: 700;
            font-size: 1.25rem;
        }

        .camp-logo svg {
            width: 24px;
            height: 24px;
        }

        .support-text {
            margin-top: 1.5rem;
            font-size: 0.875rem;
            color: #6b7280;
        }

        .support-text a {
            color: #059669;
            text-decoration: none;
            font-weight: 600;
        }

        .support-text a:hover {
            text-decoration: underline;
        }

        @media (max-width: 480px) {
            .error-container {
                padding: 2rem 1.5rem;
            }
            
            h1 {
                font-size: 1.5rem;
            }
            
            .subtitle {
                font-size: 1rem;
            }
            
            .error-icon {
                width: 60px;
                height: 60px;
            }
            
            .error-icon svg {
                width: 30px;
                height: 30px;
            }
            
            .action-buttons {
                flex-direction: column;
            }
            
            .btn {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="camp-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            CampRider
        </div>
        
        <div class="error-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
        </div>
        
        <h1>Verification Failed</h1>
        <p class="subtitle">We couldn't verify your email address</p>
        
        <div class="error-details">
            <h3>Possible reasons:</h3>
            <ul class="issue-list">
                <li class="issue-item">The verification link has expired</li>
                <li class="issue-item">The link has already been used</li>
                <li class="issue-item">Invalid verification token</li>
                <li class="issue-item">Account already verified</li>
            </ul>
        </div>
        
        <div class="action-buttons">
            <a href="https://camprider.app/register" class="btn btn-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <path d="M20 8v6M23 11h-6"/>
                </svg>
                Register Again
            </a>
            <a href="https://camprider.app/login" class="btn btn-secondary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                </svg>
                Try Login
            </a>
        </div>
        
        <p class="support-text">
            Need help? <a href="mailto:support@camprider.com">Contact our support team</a>
        </p>
    </div>
</body>
</html>
    `);
  }
};
// ---------- LOGIN ----------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!user.password) {
      return res.status(400).json({ message: "Use Google login for this account" });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email first" });
    }

    const token = generateToken(user);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------- FORGOT PASSWORD ----------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const resetToken = generateToken(user);
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail(
      user.email,
      "Password Reset",
      `<p>Click <a href="${resetLink}">here</a> to reset your password</p>`
    );

    res.json({ message: "Password reset link sent to your email" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------- RESET PASSWORD ----------
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).json({ message: "Invalid token" });

    user.password = await hashPassword(newPassword);
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

// ---------- GOOGLE OAUTH SUCCESS CALLBACK ----------
exports.googleAuthCallback = async (req, res) => {
  try {
    const user = req.user; // set by passport

    // check if profile is complete
    if (
      user.role === "pilot" &&
      (!user.studentID || !user.department || !user.vehicleNumber)
    ) {
      return res.redirect(`${process.env.CLIENT_URL}/complete-pilot-profile`);
    }

    if (
      user.role === "consumer" &&
      (!user.studentID || !user.department)
    ) {
      return res.redirect(`${process.env.CLIENT_URL}/complete-consumer-profile`);
    }

    // admin profile completeness can be handled separately

    // generate JWT for frontend
    const token = generateToken(user);

    res.redirect(`${process.env.CLIENT_URL}/dashboard?token=${token}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// get 