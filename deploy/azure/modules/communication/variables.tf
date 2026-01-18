variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "data_location" {
  description = "Data residency for Communication Services and Email (e.g., United States, Europe)"
  type        = string

  validation {
    condition = contains(
      [
        "Africa",
        "Asia",
        "Australia",
        "Europe",
        "United States",
      ],
      var.data_location
    )
    error_message = "data_location must be one of: Africa, Asia, Australia, Europe, United States."
  }
}

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "random_suffix" {
  description = "Random suffix for globally unique names"
  type        = string
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}
