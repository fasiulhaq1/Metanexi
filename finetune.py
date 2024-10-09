import torch
from lib.model import HGPIFuNetwNML
from lib.data import DataLoader

# load pre trained pifuhd model
pre_trained_path = 'path_to_pretrained_model.pth'

# Initialize the PIFuHD model
model = HGPIFuNetwNML()

# Loading the pre-trained model weights into the initialized model
model.load_state_dict(torch.load(pre_trained_path))

# Set all parameters in the model to require gradients
# This is necessary to update the weights during training
for param in model.parameters():
    param.requires_grad = True

# we define custom dataset class which loads training data
# dataset class will return images and their corresponding 3D models
# Here 'CustomDataset' is our dataset class and 'train_data_path' is our path to training data
train_dataset = CustomDataset(train_data_path)

# we create a DataLoader here to iterate through dataset
# DataLoader helps to efficiently load data in batches
# 'batch_size' determines the number of samples per batch
# 'shuffle=True' shuffles the data at every epoch
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)

# we define the loss function here to measure the difference between predicted and actual values
# 'MSELoss' is Mean Squared Error Loss, commonly used for regression tasks
criterion = torch.nn.MSELoss()

# Define the optimizer to update model weights
# 'Adam' is a popular optimization algorithm; 'lr' is the learning rate
optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)

# Number of epochs to train the model
num_epochs = 20

# Fine-tuning loop
# Loop over the dataset multiple times (num_epochs)
for epoch in range(num_epochs):
    # Set the model to training mode
    model.train()

    # Loop over each batch in the DataLoader
    for batch in train_loader:
        # Get the inputs (images) and targets (3D models) from the batch
        inputs, targets = batch

        # Zero the parameter gradients to prevent accumulation from previous steps
        optimizer.zero_grad()

        # Forward pass: Compute the model's predictions for the inputs
        outputs = model(inputs)

        # Compute the loss between the model's predictions and the actual targets
        loss = criterion(outputs, targets)

        # Backward pass: Compute the gradient of the loss with respect to model parameters
        loss.backward()

        # Update the model parameters based on the computed gradients
        optimizer.step()

    # Print the loss for each epoch to monitor training progress
    print(f"Epoch {epoch+1}/{num_epochs}, Loss: {loss.item()}")

# Save the fine-tuned model weights to a file
torch.save(model.state_dict(), 'fine_tuned_model.pth')
