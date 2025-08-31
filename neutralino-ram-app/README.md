# Roblox Account Manager

A modern, cross-platform Roblox account manager built with Neutralino.js. This application allows you to manage multiple Roblox accounts efficiently with a clean, user-friendly interface.

## Features

### 🔐 Account Management
- Add, edit, and delete multiple Roblox accounts
- Secure password storage with encryption
- Account validation and status checking
- Group organization for better account management
- Bulk operations (select multiple accounts)

### 🎮 Game Integration
- Launch Roblox games with specific accounts
- Recent games tracking
- Private server support
- Game statistics and information
- Quick launch for selected accounts

### 🎨 User Interface
- Modern, responsive design
- Multiple themes (Dark, Light, Blue, Green, Purple, Orange, Red, Roblox, High Contrast)
- Grid and list view modes
- Search and filter functionality
- Context menus for quick actions

### 📊 Data Management
- Import accounts from JSON, TXT, or CSV files
- Export account data in multiple formats
- Automatic data backup and restore
- Local storage with encryption support

### 🚀 Performance
- Fast startup and operation
- Minimal resource usage
- Cross-platform compatibility (Windows, macOS, Linux)
- Native desktop integration

## Installation

### Prerequisites
- Node.js 14+ 
- Neutralino CLI

### Setup
1. Clone or download this repository
2. Install Neutralino CLI globally:
   ```bash
   npm install -g @neutralinojs/neu
   ```

3. Navigate to the project directory:
   ```bash
   cd neutralino-ram-app
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Run the application:
   ```bash
   npm start
   ```

## Building

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Create Distribution
```bash
npm run dist
```

## Usage

### Adding Accounts
1. Click the "Add Account" button in the toolbar
2. Enter your Roblox username and password
3. Optionally add an alias and description
4. Select a group for organization
5. Click "Save"

### Launching Games
1. Select one or more accounts from the list
2. Click "Launch Selected" or right-click for more options
3. Choose a recent game or enter a game URL/ID

### Importing Accounts
1. Click the "Import" button
2. Choose file import or paste text data
3. Supported formats:
   - JSON: Full account data export
   - TXT: username:password per line
   - CSV: Comma-separated values

### Exporting Accounts
1. Click the "Export" button
2. Choose export format and options
3. Select which accounts to export
4. File will be saved to your downloads folder

## Security

- Passwords are encrypted using strong encryption
- Data is stored locally on your device
- No data is sent to external servers
- Browser profiles are isolated per account

## Keyboard Shortcuts

- `Ctrl+N` - Add new account
- `Ctrl+R` - Refresh all accounts
- `Ctrl+F` - Focus search
- `Ctrl+A` - Select all accounts
- `Ctrl+Shift+D` - Deselect all accounts
- `Ctrl+L` - Launch selected accounts
- `Ctrl+,` - Open settings
- `F5` - Refresh accounts
- `Delete` - Delete selected accounts
- `Escape` - Clear selection/close menus

## Themes

The application supports multiple themes:
- **Dark** - Default dark theme
- **Light** - Clean light theme
- **Blue** - Professional blue theme
- **Green** - Nature-inspired green theme
- **Purple** - Modern purple theme
- **Orange** - Energetic orange theme
- **Red** - Bold red theme
- **Roblox** - Official Roblox-inspired theme
- **High Contrast** - Accessibility-focused theme

## Configuration

Settings are automatically saved and include:
- Theme preference
- Auto-launch options
- Account checking preferences
- Password storage settings
- Browser integration options

## File Structure

```
neutralino-ram-app/
├── neutralino.config.json     # Neutralino configuration
├── package.json              # Project configuration
├── README.md                 # This file
└── resources/               # Application resources
    ├── index.html           # Main HTML file
    ├── css/                 # Stylesheets
    │   ├── styles.css       # Main styles
    │   └── themes.css       # Theme definitions
    ├── js/                  # JavaScript files
    │   ├── classes/         # Core classes
    │   │   ├── Account.js   # Account management
    │   │   ├── AccountManager.js # Main application logic
    │   │   ├── Game.js      # Game handling
    │   │   ├── RobloxAPI.js # Roblox API integration
    │   │   └── Storage.js   # Data storage
    │   ├── ui/              # UI components
    │   │   ├── Modal.js     # Modal dialogs
    │   │   ├── Toast.js     # Notifications
    │   │   └── ContextMenu.js # Context menus
    │   └── app.js           # Main application entry
    └── images/              # Application assets
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This application is not affiliated with or endorsed by Roblox Corporation. Roblox is a trademark of Roblox Corporation. Use this application at your own risk and in accordance with Roblox's Terms of Service.

## Support

For issues and questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

## Changelog

### Version 1.0.0
- Initial release
- Complete account management system
- Modern UI with multiple themes
- Import/export functionality
- Game integration
- Cross-platform support

## Roadmap

- [ ] Plugin system
- [ ] Cloud sync (optional)
- [ ] Advanced game statistics
- [ ] Account sharing (team features)
- [ ] Automated actions
- [ ] More import/export formats
- [ ] Mobile companion app
