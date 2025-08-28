# PowerShell script to move pages to dashboard layout

# Create directories if they don't exist
New-Item -ItemType Directory -Force -Path "app/(dashboard)/campaigns"
New-Item -ItemType Directory -Force -Path "app/(dashboard)/templates"
New-Item -ItemType Directory -Force -Path "app/(dashboard)/subscribers"
New-Item -ItemType Directory -Force -Path "app/(dashboard)/subscriber-lists"

# Copy campaigns
Copy-Item -Path "app/campaigns/*" -Destination "app/(dashboard)/campaigns/" -Recurse -Force

# Copy templates
Copy-Item -Path "app/templates/*" -Destination "app/(dashboard)/templates/" -Recurse -Force

# Copy subscribers
Copy-Item -Path "app/subscribers/*" -Destination "app/(dashboard)/subscribers/" -Recurse -Force

# Copy subscriber-lists
Copy-Item -Path "app/subscriber-lists/*" -Destination "app/(dashboard)/subscriber-lists/" -Recurse -Force

Write-Host "Pages moved to dashboard layout structure"