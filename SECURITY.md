# Security Policy

We take the security of `nuxt-users` seriously. We appreciate your efforts to disclose your findings responsibly and will make every effort to acknowledge your contributions.

## Supported Versions

As of now, we only support the latest major version of this project. If you are running an older version, please upgrade before reporting a vulnerability, as it may have already been patched.

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporting a Vulnerability

If you have discovered a security vulnerability in this project, please do **not** open a public issue. Publicly disclosing a vulnerability can put the entire community at risk.

Instead, please adhere to the following process:

1.  **E-Mail**: Send a detailed description of the vulnerability to [rrd@webmania.cc](mailto:rrd@webmania.cc).
2.  **Subject Line**: Please use the subject line: `SECURITY: Vulnerability in "nuxt-users"`.
3.  **Details**: Include as much information as possible to help us reproduce the issue.  This is key. Without reproduction, finding a solution is nearly impossible. This should include:
    *   Type of vulnerability (e.g., XSS, SQL Injection, RCE).
    *   Step-by-step instructions to reproduce the vulnerability.
    *   Proof-of-concept code or screenshots, or videos.
    *   Impact of the vulnerability.

### Response Timeline

We are committed to promptly addressing security issues.

*   **Acknowledgement**: We will acknowledge receipt of your report within 48 hours.
*   **Assessment**: We will assess the severity and impact of the vulnerability within five business days.
*   **Fix**: We will release a patch or a mitigation as soon as possible, depending on the issue's complexity.

## Security Best Practices for Users

While we strive to keep `nuxt-users` secure, security is a shared responsibility. We recommend the following best practices for users of this project:

*   **Keep Dependencies Updated**: Regularly update your Node.js dependencies to ensure you have the latest security patches.
*   **Environment Variables**: Never commit sensitive keys or secrets (like API keys or database credentials) to your version control system. Use `.env` files and ensure they are included in your `.gitignore`.
*   **Input Validation**: Always validate and sanitize user inputs on both the client and server sides to prevent injection attacks.

## Disclaimer

This project is provided "as is" without warranty of any kind, express or implied. The author(s) and contributor(s) shall not be held liable for any damages arising from the use of this software.

---

♥️ *Thank you for helping keep the community safe.*
