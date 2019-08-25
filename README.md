# Jelbrek
## Notice
No support will be provided in self-hosting the Jelbrek repo. The source code is only provided for transparency.  

**Do not use this repository software to distribute cracked or otherwise pirated packages.**

## Security
To report a security vulnerability, contact [me](https://keybase.io/relative) through the email linked on my Keybase.  
Do not test any security vulnerabilities on the production version of Jelbrek. 

## Services Required
| Service | Usage | Tested Version |
| --- | --- | --- |
| nodejs | JavaScript interpreter | >12 required |
| redis | Caching Packages & gzip/bzipped variants to ease load on postgres | 4.0.9
| postgresql | Storing all users, packages and package versions in database | 11.4
| Amazon S3<sup>1</sup> | Storing package debs for serving to users |
| Google Cloud Storage<sup>1</sup> | Storing package debs for serving to users |

<sup>1</sup> Amazon S3 and Google Cloud Storage is interchangable, local storage is not supported for scaling reasons

## Running
It is recommended you use Docker and [docker-compose](https://docs.docker.com/compose/) to run the backend.