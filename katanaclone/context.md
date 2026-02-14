Gemini said
This project, titled Secure Corporate Voting Platform, is a decentralized application (dApp) designed to facilitate transparent, tamper-proof, and highly secure internal elections for corporate environments. By integrating blockchain technology with multi-factor biometric authentication, the system ensures that every vote is cast by a verified employee and remains immutable once recorded.
+4

Core Project Components
Blockchain Infrastructure: The system utilizes a Governance smart contract as its central engine, which manages the creation of proposals, tracks the voting period, and automates the final tallying process.

Progressive Web App (PWA): Developed using PWABuilder, the platform functions as an installable application on Android and desktop devices, offering a native-app experience without requiring a traditional app store download.


Identity Layer: To prevent fraud and Sybil attacks, the platform employs a three-step verification process consisting of Corporate Email OTP, Face Recognition with Liveness Detection, and Device Biometrics (via WebAuthn).
+1


Real-Time Analytics: A Live Results Panel utilizes Socket.io and Ethers.js to stream and visualize voting progress in real-time, providing an immediate and transparent audit trail for all stakeholders.

User Experience (The Voter)
Secure Access: Employees log in using their corporate credentials and connect a digital wallet that is uniquely linked to their corporate identity.


Biometric Authorization: Before casting a ballot, voters must pass a face scan and a liveness check to confirm they are physically present and not using a photo or video bypass.
+1


Mobile-First Voting: Through the PWA, voters can browse active company proposals—such as board elections or policy changes—and cast their votes directly from their mobile devices.

Instant Verification: After voting, users receive a cryptographic receipt, and their masked transaction is immediately visible on the public live panel, ensuring their vote was counted correctly.

Administrative Experience (The Election Commission)
Proposal Management: Administrators use the governance interface to define the parameters of an election, including the description, quorum requirements, and the start/end timestamps.

Authorized Voter Lists: Admins manage a secure database of eligible employee wallets and emails, ensuring that only current staff members can participate in specific polls.


Transparent Oversight: The admin dashboard provides high-level views of voter turnout and real-time trends without compromising the anonymity of individual voters.

Immutable Execution: Once a proposal succeeds by meeting its deadline and quorum, the results are permanent and can trigger automated actions through the blockchain, such as updating a corporate policy or releasing funds from a vault.

Technical Specifications
Smart Contracts: Built on Solidity 0.8.24 using OpenZeppelin standards for ERC20 (voting power) and Governance (voting logic).

Development Framework: Managed via Hardhat for multi-chain deployment, testing, and gas reporting.

Real-Time Data: Employs Ethers.js listeners on the backend to detect Voted events and broadcast them via Socket.io to the frontend.

Data Security: Implements privacy filters to mask voter addresses in public views and uses the WebAuthn API to handle biometrics locally on the user's device, ensuring sensitive data never leaves the hardware.