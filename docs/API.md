# Jelbrek API
The public instance of the Jelbrek API is running on [https://repo.jelbrek.com](https://repo.jelbrek.com). This is known as the "base url".

## Terms
| Term            | Definition                                    |
|-----------------|-----------------------------------------------|
| Package Manager | Cydia/Sileo/any package manager that uses APT |

## API Information
All endpoints that take a body will accept application/x-www-form-urlencoded and application/json bodies.

## Endpoints
Structure:
* RouterSourceFile.ts (/mount point)
    * GET /endpoint
    * POST /endpoint
    * PUT /endpoint

### AuthRouter.ts (/auth)
#### POST /register
Fields:
* username
    * Username in string form
    * Must be greater than or equal to 3 characters
    * Must be shorter than or equal to 20 characters
* email
    * Email in an "email" form
    * Must conform to an email
    * Will be required to be verified by the user if email verification is on
* password
    * Password in string form
    * Must be longer than 4 characters
##### Request
```http
POST /auth/register
{
  "username": "sample",
  "password": "I8nEEK0sVn",
  "email": "user@example.com"
}
```
##### Response (Requires email verification, 200)
```json
{
  "message": "Account is awaiting email verification"
}
```
##### Response (all OK, 200)
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNTIzODc1NTEyNzkxODgxIn0.GPqswVjnqL39vSkayv5xHurc2_l_rmRuzVV7RQepqnE" // JWT with user defined in payload
}
```

### CydiaRouter.ts (/)
#### GET /Release
Gets the Release file with repo information for use in a Package Manager.

#### GET /Packages(.gz,.bz2)
Gets the Packages file for use in a Package Manager.

### PackageRouter.ts (/package)
#### GET /
Gets a JSON array of every package that is approved and not private
#### GET /featured
Gets a JSON array of every package that is featured by a repo moderator/admin

#### GET /:packageId
Gets a package with its versions
#### PUT /:packageId
Creates a package (requires developer permissions)
#### PATCH /:packageId
Updates a package (requires developer permissions and ownership of the package)

#### GET /:packageId/versions
Gets all versions of a specific package

#### GET /:packageId/versions/:version
Gets a specific version from a specific package
#### PUT /:packageId/versions/:version
Creates a version on a specific package (requires developer permissions and ownership of the package)
#### PATCH /:packageId/versions/:version
Updates a specific version on a specific package (requires developer permissions and ownership of the package)

#### POST /:packageId/versions/:version/upload
Uploads a deb file for the package version (requires developer permissions and ownership of the package)
Fields:
* file
    * File uploaded in a form
#### GET /:packageId/versions/:version/download(.deb)
Downloads the deb file for the package, will redirect to the GCS/S3 url for the version