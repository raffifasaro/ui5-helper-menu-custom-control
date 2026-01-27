# Getting Started

This is a simple implementation of an example dashboard with the integration of our custom controls.
It runs on the SAP AI Core and therefore needs to be set up correctly to work.

#### Step 1:
Navigate to `Demo\helper-control-demo`

#### Step 2:
Install Dependencies
```bash
npm install
```

#### Step 3:
Log in to your SAP BTP space. Using SSO is recommended for corporate accounts
```bash
cf login -a <your-api-endpoint> -sso
```

#### Step 4:
Bind your local application to the required service instances:
```bash
cds bind -2 <service-instance-name>
```

#### Step 5:
Run the CAP server locally while using the credentials and services from the cloud:
```bash
cds watch --profile hybrid
```


## Learn More

Learn more at https://cap.cloud.sap/docs/get-started/.
