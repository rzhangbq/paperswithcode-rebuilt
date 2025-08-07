# Papers with Code Rebuilt

A modern web application that provides a comprehensive interface for exploring academic papers, code repositories, datasets, methods, and leaderboards from the Papers with Code platform. This project rebuilds the core functionality of Papers with Code with a focus on performance, user experience, and modern web technologies.

## 🎯 Purpose

This application serves as a research tool for:
- **Researchers** looking for the latest papers in their field
- **Developers** seeking code implementations of research papers
- **Students** exploring datasets and methods for their projects
- **Anyone** interested in staying updated with cutting-edge AI/ML research

## 🚀 Features

- **📄 Papers Browser**: Search and browse academic papers with abstracts
- **💻 Code Repositories**: Find official and community code implementations
- **🏆 Leaderboards**: View performance evaluations across different datasets and tasks
- **📊 Datasets**: Explore datasets used in research
- **🔬 Methods**: Discover research methods and approaches
- **🔍 Advanced Search**: Search across papers, titles, and abstracts
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Query** for data fetching and caching
- **React Router** for navigation
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js
- **SQLite** for data storage and efficient querying
- **Database-driven architecture** for fast data access

### Data Sources
- Papers with Code API data (papers, code links, evaluations, methods, datasets)
- SQLite database with optimized schema and indexes

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- wget (for downloading data files)
- gunzip (for extracting compressed files)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd paperswithcode-rebuilt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the database** (if not already built)
   ```bash
   cd data
   python build_database.py
   ```
   This will:
   - Create the SQLite database from JSON files
   - Set up optimized schema with indexes
   - Import all data efficiently

4. **Start the development server**
   ```bash
   npm run dev:full
   ```
   This starts both the backend server (port 3001) and frontend development server (port 5173)

## 🏃‍♂️ Running the Application

### Development Mode
```bash
# Start both frontend and backend
npm run dev:full

# Or start them separately
npm run server    # Backend only (port 3001)
npm run dev       # Frontend only (port 5173)
```

### Production Build
```bash
# Build the frontend
npm run build

# Start the production server
npm run server
```

## 🏗️ Project Structure

```
paperswithcode-rebuilt/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── Header.tsx           # Navigation and search header
│   │   ├── PaperCard.tsx        # Individual paper display
│   │   ├── DatasetCard.tsx      # Dataset information display
│   │   ├── MethodCard.tsx       # Method information display
│   │   ├── LeaderboardTable.tsx # Performance leaderboard
│   │   └── LoadingSpinner.tsx   # Loading indicator
│   ├── hooks/                   # Custom React hooks
│   ├── services/                # API service functions
│   ├── types/                   # TypeScript type definitions
│   ├── App.tsx                  # Main application component
│   └── main.tsx                 # Application entry point
├── data/                        # Data files and database
│   ├── papers_with_code.db     # SQLite database with all data
│   ├── build_database.py       # Database builder script
│   └── README.md               # Database documentation
├── server.js                   # Express.js backend server
└── package.json                # Project dependencies and scripts
```

## 🔧 Components Overview

### Frontend Components

- **Header**: Navigation bar with search functionality and tab switching
- **PaperCard**: Displays paper information including title, authors, abstract, and code links
- **DatasetCard**: Shows dataset details and usage statistics
- **MethodCard**: Presents research methods and their applications
- **LeaderboardTable**: Displays performance rankings for different tasks and datasets
- **LoadingSpinner**: Visual feedback during data loading

### Backend Services

- **Database API**: Fast SQLite-based data access with optimized queries
- **Search API**: Provides fast search across papers and abstracts using database indexes
- **Pagination Service**: Efficient pagination for large datasets
- **Leaderboard Service**: Real-time performance rankings and evaluations

## 📊 Data Sources

The application uses data from Papers with Code:
- **Papers**: Academic papers with abstracts and metadata
- **Code Links**: Connections between papers and their code implementations
- **Evaluations**: Performance metrics and leaderboards
- **Methods**: Research methods and approaches
- **Datasets**: Dataset information and usage statistics

## 🗄️ Database Architecture

The application now uses a **SQLite database** instead of JSON streaming for improved performance:

### Benefits:
- **Faster queries** with database indexes
- **Reduced memory usage** (no need to load large JSON files)
- **Better search performance** with SQL LIKE queries
- **Efficient pagination** for large datasets
- **Relational data structure** with proper foreign keys

### Database Schema:
- **Core tables**: papers, authors, tasks, methods, datasets, evaluations, code_links
- **Relationship tables**: paper_authors, paper_tasks, paper_methods, evaluation_categories_rel
- **Optimized indexes** on frequently queried fields

### Migration:
- The old JSON streaming approach has been replaced with database queries
- All data is now stored in `data/papers_with_code.db`
- Large JSON files have been removed to save disk space (~2.7GB freed)

## 🔍 Search Functionality

- **Full-text search** across paper titles and abstracts
- **Real-time results** with debounced input
- **Pagination** for large result sets
- **Filtering** by different data types

## 🎨 UI/UX Features

- **Modern Design**: Clean, responsive interface using Tailwind CSS
- **Dark/Light Mode**: Automatic theme detection
- **Loading States**: Smooth loading indicators
- **Error Handling**: Graceful error messages and recovery
- **Mobile Responsive**: Optimized for all screen sizes

## 🚀 Performance Optimizations

- **SQLite database** with optimized schema and indexes for fast queries
- **React Query caching** for API responses
- **Lazy loading** of components and data
- **Efficient pagination** for large datasets
- **Database-driven search** with full-text search capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Papers with Code](https://paperswithcode.com/) for providing the data
- The open-source community for the amazing tools and libraries used in this project

## 📞 Support

If you encounter any issues or have questions:
1. Check the existing issues in the repository
2. Create a new issue with detailed information about your problem
3. Include system information and error messages

---

**Happy researching! 🎓** 


# Papers with code datasets

You can download the full dataset behind [paperswithcode.com](https://paperswithcode.com) here:

Download links for the data dumps are:

- [All papers with abstracts](https://production-media.paperswithcode.com/about/papers-with-abstracts.json.gz)
- [Links between papers and code](https://production-media.paperswithcode.com/about/links-between-papers-and-code.json.gz)
- [Evaluation tables](https://production-media.paperswithcode.com/about/evaluation-tables.json.gz)
- [Methods](https://production-media.paperswithcode.com/about/methods.json.gz)
- [Datasets](https://production-media.paperswithcode.com/about/datasets.json.gz)

The last JSON is in the [sota-extractor](https://github.com/paperswithcode/sota-extractor) format and the code
from there can be used to load in the JSON into a set of Python classes. 

At the moment, data is regenerated daily.

Part of the data is coming from the sources listed in the [sota-extractor README](https://github.com/paperswithcode/sota-extractor).

## Licence

All data is licenced under [CC-BY-SA](https://creativecommons.org/licenses/by-sa/4.0/). 


