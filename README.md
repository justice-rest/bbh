# BBH

https://burnedbyher.xyz

## Overview
This repository contains multiple sub-projects categorized into different levels of execution environments. Each folder represents a different deployment stage:

- `/welldone` - A well-polished production-ready version.
- `/rare` - An early-stage development version.
- `/mediumrare` - A balance between production and development with some experimental features.

Each sub-project follows a standardized approach for installation and execution.

---

## Installation & Setup
### Prerequisites
Ensure you have the following installed before proceeding:
- **Node.js** (LTS recommended)
- **npm** (comes with Node.js)
- **Git** (for version control)

### Cloning the Repository
```sh
git clone https://github.com/your-repo/justice-rest-bbh.git
cd justice-rest-bbh
```

### Installing Dependencies
Run the following command inside each sub-folder (`welldone`, `rare`, `mediumrare`) to install dependencies:
```sh
npm install
```

### Running the Development Server
For each sub-project, navigate to its directory and run:
```sh
npm run dev
```
This will start a local development server with hot-reloading enabled.

---

## Project Structure
```
justice-rest-bbh/
│── landing-page/       # Main landing page
│── mediumrare/         # Mid-tier development stage
│── rare/               # Early development stage
│── welldone/           # Production-ready version
│── LICENSE.md          # Licensing information
│── package.json        # Node.js dependencies & scripts
│── README.md           # This file
│── tsconfig.json       # TypeScript configuration
└── .gitignore          # Git ignore file
```

---

## Deployment
Each environment can be deployed separately using Vercel (or any preferred hosting service):
```sh
npm run build  # Build for production
npm run start  # Start the production server
```

---

## Useful Commands
### Linting
Run ESLint to check for coding issues:
```sh
npm run lint
```

### Formatting
Prettier is used for code formatting:
```sh
npm run format
```

### Running Tests
If applicable, run tests using:
```sh
npm test
```

---

## Contributing
1. Fork the repository.
2. Create a new feature branch: `git checkout -b feature-branch`.
3. Commit your changes: `git commit -m "Add new feature"`.
4. Push the branch: `git push origin feature-branch`.
5. Open a Pull Request.

---

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

---

## Contact
For issues, feature requests, or inquiries, reach out via GitHub Issues or the repository maintainers.

