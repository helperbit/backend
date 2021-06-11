# Helperbit Backend

# Clone

## With submodules (deploy)

```
git clone https://gitlab.com/helperbit/backend/backend.git
git submodule update --init --recursive
git submodule update --recursive --remote
```

## Without submodules (dev)

```
git clone https://gitlab.com/helperbit/backend/backend.git
cp source/config_dev/*.json source/config/
```


# Install & Start

Install dependencies:

``` 
npm install
```

First, start mongodb and redis. 

Then start API server:

``` 
npm start
```

Start Job worker:

``` 
npm run start-job
```

# Access

The default configuration will serve apis and backoffice to localhost:3000/api/v1 and localhost:3000/admin/.

