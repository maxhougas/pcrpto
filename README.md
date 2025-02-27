# PCR Players' Club PTO request
## Designed to run on [these containers](https://hub.docker.com/r/maxhougas/pcrpto)
## Environmental Variables
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
## Login Page
![Login Page](images/loginpage.jpg)
