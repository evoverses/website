aws ec2 create-security-group \
  --group-name bastion-sg \
  --description "Allow SSH access from my IP" \
  --vpc-id vpc-0e771bfadb1202805
aws ec2 authorize-security-group-ingress \
  --group-id sg-0c16fe2ae7de4a9ef \
  --protocol tcp \
  --port 22 \
  --cidr <your-ip>/32
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.micro \
  --key-name nick-desktop-2025-ed25519 \
  --security-group-ids sg-0c16fe2ae7de4a9ef \
  --subnet-id subnet-0537e433295c41852 \
  --associate-public-ip-address \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=BastionHost}]' \
  --iam-instance-profile Name=SSMEnabledRole
aws ec2 authorize-security-group-ingress \
  --group-id sg-0354c47597689774a \
  --protocol tcp \
  --port 5432 \
  --source-group sg-0c16fe2ae7de4a9ef
aws ec2 run-instances --profile evoverses --image-id ami-0c55b159cbfafe1f0 --instance-type t3.micro --key-name nick-ec2 --security-group-ids sg-0c16fe2ae7de4a9ef --subnet-id subnet-0537e433295c41852 --associate-public-ip-address --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=BastionHost}]'
