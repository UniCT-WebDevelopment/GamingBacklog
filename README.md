# GamingBacklog

GamingBacklog is a web application designed to help you keep track of the games you've played and the ones you want to play. It also includes a chat feature to discuss games with others.

## Installation

Follow these steps to install the project.

### Prerequisites

- **Node.js** and **npm**: For running the application.
- **MongoDB Atlas Account**: For database hosting. You'll need to create a MongoDB Atlas account and set up a cluster. For more info, visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

### Steps

1. Clone the repository and navigate to the project directory:

    ```sh
    git clone https://github.com/UniCT-WebDevelopment/GamingBacklog.git
    cd GamingBacklog
    ```

2. Obtain your connection string from **MongoDB**:
   - The key should look something like this:
     ```text
     mongodb+srv://username:password@cluster0.mongodb.net/
     ```

3. Create a `.env` file with the necessary parameters (replace with your credentials) and place it in the project directory. The required parameters are:

    ```env
    DB_CONNECTION_STRING= your-mongodb-connection-string
    JWT_SECRET= "8fbb5e8d43c9a7b17b99c2c6d4e4c8d7f9e394b3d3e8b1f2a87e5d0b6f3f9a77"
    PORT = 8888
    ```

4. Install the dependencies:

    ```sh
    npm install
    ```

## Usage

Start the application with the following command:

```sh
npm start
```

The application will be accessible at http://localhost:8888 by default. Replace PORT with your preferred port number in your .env file.

## Technologies Used

### Frontend
- **HTML**, **CSS**, **JavaScript**: Basic web technologies used for building the user interface.

### Backend
- **Node.js**: Server-side JavaScript runtime for building the backend.
- **Socket.IO**: Used for enabling real-time, bidirectional communication for the chat feature.
- **Multer**: Middleware used for handling image uploads in the application.
- **MongoDB**: NoSQL database used for storing and retrieving application data.
