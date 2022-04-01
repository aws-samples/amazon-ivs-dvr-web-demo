.DEFAULT_GOAL := help

.PHONY: help app install bootstrap deploy destroy clean

AWS_PROFILE_FLAG = --profile $(AWS_PROFILE)
CDK_OPTIONS := $(if $(AWS_PROFILE),$(AWS_PROFILE_FLAG))
STACK 			?= VODRenditionPlaylistStack

help: ## Shows this help message
	@echo "\n$$(tput bold)Available Rules:$$(tput sgr0)\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST)\
	 | sort \
	 | awk  \
	 'BEGIN {FS = ":.*?## "}; \
	 {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo "\n$$(tput bold)IMPORTANT!$$(tput sgr0)\n"
	@echo "1. If AWS_PROFILE is not exported as an environment variable or provided through the command line, then the default AWS profile is used. \n" | fold -s
	@echo "   Option 1: export AWS_PROFILE=user1\n"
	@echo "   Option 2: make <target> AWS_PROFILE=user1\n"
	@echo "2. Destroying the stack will result in a partial deletion of the stack resources as only the associations between the Lambda@Edge functions and CloudFront will be deleted, along with the CloudFront distribution. The remaining Lambda@Edge replicas will typically be automatically deleted by CloudFront within a few hours, at which point you will be able to run the 'destroy' target again to delete the stack and remaining Lambda functions or manually delete them from the console." | fold -s

app: install bootstrap deploy ## Installs NPM dependencies, bootstraps, and deploys the stack

install: ## Installs NPM dependencies
	@echo "Installing NPM dependencies..."
	npm install

bootstrap: ## Deploys the CDK Toolkit staging stack
	@echo "Bootstrapping..."
	npx cdk bootstrap $(CDK_OPTIONS)

deploy: ## Deploys the stack and sanitizes the stack output
	@echo "Deploying $(STACK)..."
	npx cdk deploy $(STACK) --outputs-file temp_out.json $(CDK_OPTIONS)
	@echo "Sanitizing CDK output..."
	node sanitize-output
	rm temp_out.json
	@echo "\n$$(tput bold) ✅ $(STACK) Deployed Successfully $$(tput sgr0)\n"

destroy: clean ## Destroys the stack and cleans up
	@echo "Destroying $(STACK)..."
	npx cdk destroy $(STACK) $(CDK_OPTIONS)

clean: ## Deletes the cloud assembly directory (cdk.out)
	@echo "Cleaning..."
	rm -r cdk.out
