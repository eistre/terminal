terraform {
  required_version = "~> 1.15"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.57"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.8"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id                 = var.subscription_id
  resource_provider_registrations = "core"
  resource_providers_to_register = [
    "Microsoft.App",
    "Microsoft.Communication",
    "Microsoft.DBforMySQL",
    "Microsoft.ContainerInstance",
    "Microsoft.KeyVault"
  ]
}
