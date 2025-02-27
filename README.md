<a name="toc" />
# PCR Players' Club PTO request

<a name='setup'/>
## Set up
- Designed to run on [these containers](https://hub.docker.com/r/maxhougas/pcrpto)

<a name='environmental-variables'/>
### Environmental Variables
- BOSPAS(bospas): PTO admin DB password
- CLIPATH(/home/user/pcrpto/client/out): Path to the folder containing static resources (index.html)
- CRTPAS(crtpas): SSL certificate password
- DEFPAS(defpas): Default password for frontend users
- EMPPAS(emppas): DB password for regular users
- MIP(172.17.0.1): IP address of the DB
- MPORT(3306): Port the DB listens on
- NIP(%): IP address of the node back end
- NPORT(5000): Port the node back end listens on

It is recommended to create a environment variables file and pass it to the containers at run time

The following is an example with the default values:
```
BOSPAS=bospas
CLIPATH=/home/user/pcrpto/client/out
CRTPAS=crtpas
DEFPAS=defpas
EMPPAS=emppas
MIP=172.17.0.1
MPORT=3306
NIP=172.17.0.1
NPORT=5000
```
### Docker Network
- The bridge network will not allow user specified IP addresses for containers.
- Create a custom network with the following
`docker network create -d bridge --subnet=172.31.0.0/28 pcrpto`
- The subnet may be altered as necessary; 172.31.0.0/28 is an example that is likely to work.
- Check your local network configuration to determine which subnets are already in use
  - Most common networks already in use are 10.0.0.0/8 and 192.168.0.0/16
- It is *highly* recommended that you use IPv4 ranges IANA has reserved for private use
  - These are 10.0.0.0 - 10.255.255.255, 172.16.0.0 - 172.31.255.255, and 192.168.0.0 - 192.168.255.255
  - [Wikipedia](https://en.wikipedia.org/wiki/Reserved_IP_addresses#IPv4)
  - [RFC6890](https://www.rfc-editor.org/rfc/rfc6890#section-2.2.2) See tables 2, 6, and, 11
  - [RFC1918](https://www.rfc-editor.org/rfc/rfc1918#section-3)

### Running Containers
- Containers can be run with the following
`docker run -d --network=pcrpto --ip=IPV4ADDR -p EXPORT:INPORT/tcp --env-file ENVFILE --name CONTAINERNAME maxhougas/pcrpto:TAG
  - IPV4ADDR(172.31.0.2 OR 172.31.0.3): Some ipv4 address within the range.
    - The first address (.0) refers to the network itself
    - The second address (.1) is usually the default gateway
    - The last address (Usually .255, but .7 in our example) is the broadcast address for the network
    - Any other address should be available for specific hosts. We will use .2 for the database and .3 for the back end.
  - EXPORT(3306 OR 5000)
    - The external port the container will listen on
    - Ensure that it does not conflict with anything else listening on the host system
    - We will use 3306 for the database and 5000 for the back end
    - Verify current listeing ports with `lsof -nP -iTCP:3306 -sTCP:LISTEN` and `lsof nP -iTCP:5000 -sTCP:LISTEN`
    - These may be adjusted based on need provided that the relvante changes are made in the evironment variables file
  - INPORT(3306 OR 5000)
    - The internal port the containerized program is listening on
    - The database internal port cannot be changed at this time; it must remain 3306
  - ENVFILE
    - Path/name of the environment variable file you made [here](#environmental-varaibles)

<a name='operation'/>
## Operation
### Login Page
![Login Page](images/loginpage.jpg)
- Type random things into both boxes until it works

## Employee Mode
![Employee Mode](images/employeemode.jpg)
- Submit Request
  - Put the start time in the left datetime box
  - Put the end time in the right datetime box
  - Press Submit Request
- Revoke Request
  - Press View Requests
  - Copy the ID number into the Ausweis box
  - Press Revoke Request

## Change Password
![Change Password Screen](images/changepassword.jpg)
- Enter user name into the top left box
- Enter current password into the top right box
- Enter the new password into both bottom boxes
- Press Confirm
