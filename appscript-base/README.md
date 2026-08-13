# AppScript Enterprise Framework (AEF)

Reusable, modular, 5-layered application framework for Google Apps Script (.gs) & Google Spreadsheet.

## Structure
- `src/core/`: Utilities (`Response.gs`, `Logger.gs`, `Utils.gs`, `SetupDatabase.gs`)
- `src/repositories/`: Spreadsheet I/O (`BaseRepository.gs`, `UserRepository.gs`, etc.)
- `src/services/`: Business Logic (`AuthService.gs`, `AuditService.gs`, `UserService.gs`, `MenuService.gs`)
- `src/controllers/`: Route & Request Handlers (`MainController.gs`, `ApiController.gs`)
- `src/views/`: HTML Service UI Shell (`Index.html`, `Login.html`, `Dashboard.html`, `Users.html`, `styles.html`, `scripts.html`)

## Development & Deployment
```bash
# Push code to Google Apps Script
clasp push
```

## Commit Conventions
Formatting: `type(scope): concise description`
Example: `feat(init): initialize AEF framework 5-layer architecture`
