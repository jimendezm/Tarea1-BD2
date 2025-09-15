# Tarea1-BD2
## Instalación Paso a Paso
### Instalar Docker
sudo apt install docker.io -y

### Iniciar servicio Docker
sudo service docker start

### Agregar usuario al grupo docker
sudo usermod -aG docker $USER

### Verificar instalación
docker --version

