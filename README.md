# CIS-4500-5500-Group-41-Final-Project
## Description
For our final project for CIS 4500/5500, we have decided to create a climate visualizer application that allows the user to map relationships between crop yield and climate metrics in the various states in America. Our project, HarvestMatch, aims to assist farmers, home gardeners and agricultural planners in determining which crops are most suitable to grow based on their geographic region. The core problem we attempt to address is the lack of accessible, region-specific agricultural guidance that takes into account many diverse factors relating to the region.

Our application has several pages outlined below:

**Home Page:** This is the front page of the website, and the default first page that is opened when a user opens the webpage. It contains our slogan, some basic information on the website, and a button to start exploring which directs users to the map page.

**Map Page:** This page contains a map of the United States, where users can click on a state and it will display optimal crops to grow in that state. This is based on multiple factors such as weather conditions, pollution information and precipitation data. 

**Search Page:** This page allows users to input certain filters such as precipitation requirements, pollution requirements, geographic region, etc. The backend will then filter crops on these requirements and output the most optimal crops for those conditions.

**Crop Info Page:** This page contains information on each crop in the database, including its most optimal conditions. Users can click on any crop card and it will display information about the crop. 

**Crop Trends Page:** This page contains interactive charts for crops based on historical trends. Users can use it to gain a historical understanding of crop yield compared to several climate metrics.

**Crop Leaderboard Page:** This page depicts a bar chart of the crops from most to least climate resilient. Climate resilience was determined to be those crops which had the highest yield in extreme weather conditions. 

**Seasonal Info Page:** This page suggests which crop is best to grow in each season based on yield, and which season is best to grow each crop.

## How To Set Up Locally
### Step 1: Cloning the Repository
Enter this command in the terminal
```sh
git clone https://github.com/mkhosla11/CIS-4500-5500-Group-41-Final-Project.git
```

### Step 2: Open in VS code
1. Open the project in a text editor (e.g., **Visual Studio Code** recommended).
2. Use the following commands in a terminal to start the server:

```sh
cd server
npm install
npm start
```
3. Use the following commands in a separate terminal to start the client:

```sh
cd client
npm install
npm install recharts --legacy-peer-deps
npm install react-simple-maps d3-geo --legacy-peer-deps
npm start
```
A window should open on your browser directing you to our application.


