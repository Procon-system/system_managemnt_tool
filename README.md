# installation guide

Prerequisites

Before starting, ensure you have the following installed on your system:

Docker: Install Docker

Docker Compose: Included with Docker Desktop or install it separately.

Git: Install Git

Node.js and npm (for local development without Docker): Install Node.js
   
   # Project Setup

1. Clone the Repository

Clone project repository from GitHub:

git clone git@github.com:Betelhemmesele/system_managemnt_tool.git

2.Environment Variables

Backend

Navigate to the backend directory.

Create a .env file if it doesn't exist:

touch .env   # add .env code to this file

Frontend

Navigate to the frontend directory.

Create a .env file:

touch .env   # add .env code to this file

3.Build and Run the Project

Build the Docker images:
 
docker-compose up --build

Start the services:

docker-compose up

Access the application:

Frontend: http://localhost:3000

Backend: http://localhost:5000

4.Stopping the Services

To stop the services, use:

docker-compose down

Troubleshooting

Port Conflicts:

Ensure ports 3000, 5000, and 27017 are not in use.

MongoDB Connection Issues:

Check the MONGO_URI in your .env file.

Rebuild Containers:

If changes aren’t reflected, rebuild the containers:

docker-compose up --build

# Service_managemnt_tool description
The service Management tool should be a platform were a Person is able to see move (move in Time by drag and drop) setup and distribute service Tasks from one or Multiple Machines. 
He should be able to distribute the Tasks to one ore Multiple Human or Technical resources such service Personal or needed Materials or Tools for the service etc. 

The Service Personal should be able to Receive (view it in the App) and access the Task description and fulfill the Task and Flag it to “done” or “not possible”. In case of done the Task will be 
moved to a History List and can be reviewed from the service Manager. In case of not possible it will stay in the Task list and can be new distributed or modified. Both Manager and Service personal 
should be able to add Notes and Pictures to the Task until it is moved to the History list.
The App should be able to receive Task Objects from a Machine. This Objects will be transferred using MQTT to the App.
The Object of the Machine Task has the same structure like the objects that will be setup in the Application and will be further handled as a new setup Tasks.
The Application should have a access Management were Manager and service personal need to  sign up (by admin) and sign in. This access management should have 5 login level (set able for the person by admin) 
this login level later will be used to view dedicated content in the App for example the Manager should have the right to edit new Tasks the Service Personal should be not able to do so etc.

The App should have a Warning Alarming structure and send mails ore SMS for information to the setup receiver.

The basis for this will be a Calendar structure because all Tasks are equal to Calendar events and will be handle like this.

App Structure

The app should be able to run under Linux OS using a X86 device as a Server component or run on a cloud server setup.
The App will be finally transferred into a Docker file for easy setup on new HW or Cloud devices.

Software Sources:
JavaScript, CSS, HTML, MQTT, nodes, xx as needed

Back end:
Nodes will be the host and interpreter for the Script codes

Front end:
The Graphical Interface will be displayed using a Browser on a Mobil or desktop Device in the same Network  

Development Framework is not specified and after discussion with Project leader free of Joyce.


The Calendar App from Github https://github.com/vkurko/calendar?tab=readme-ov-file

mind be helpful to save development time but it is not mandatory to use it. 
Styles and design can be free selected (nice ones please)

Features:

Receive Tasks from a Machine and show them on the Calendar Platform 
Setup manual additional Tasks by clicking on a free Time slot on the Calendar
by clicking on a free Time slot open the editor form for a Task
Tasks must be movable in the Calendar Timeline by Drag and drop
open the Task by clicking on the Task for review or modification
Show a preview of the Task on the Calendar Object
Set able time before the Task time color of the task switch to Yellow
If Task time is reached Task color switch to Red
if Alarm/warning is setup the App send a SMS or mail
Task can be flagged by pushing a button to done or not done
Task can be assigned to one or more service personal
History list for done Tasks
use management with 5 access level
Editable Technical resources list Tool, costs
Editable Human resources list Person, work hours, costs 
Block of resources or notice of double use 

Development Steps

1. Create a workable node environment
- Download and install the Calendar Application
- create a docker file of this setup for testing and easy transfer of the progress
- Setup a Task object and GUI Form for creating new task
- setup persistent Database to store the Tasks
- setup login Page and user Management
- setup Persistent user Database
- create Tool Database 
- create Material Database
- create color handling of the Task green/yellow/red
----------Tools, Task, Material, user, can be Handled in one Database but different Array------

- send run able docker file --

2. setup MQTT communication and exchange of Task Object
- setup distribution of the Task to the dedicated Personal
- setup Historical view can be generated from the main Database
- use Access level 5 for admin purpose (access to all features)
- Access level 1 for just view, 2 for service People, 3 for Manager

- send run able docker file --



3. create the form for setup human resources
- create Form for setup Tools
- create Form for setup Materials
- create Picture handling and saving to the Task

- send run able docker file --

4. Create Alarming
- create Form for mail editing
- create Form for SMS editing
