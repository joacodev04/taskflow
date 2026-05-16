CREATE DATABASE IF NOT EXISTS `Tareas`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `Tareas`;

CREATE TABLE IF NOT EXISTS `usuario` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(120) NOT NULL UNIQUE,
    `contrasenia` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tareas` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nombreTarea` VARCHAR(255) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `prioridad` ENUM('urgente', 'importante', 'deseable') NOT NULL,
    `fechaLimite` DATE NULL,
    `usuario_id` INT NOT NULL,
    CONSTRAINT `fk_tareas_usuario`
        FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`)
        ON DELETE CASCADE,
    CONSTRAINT `uq_tarea_usuario`
        UNIQUE (`nombreTarea`, `usuario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- El usuario demo `usuario1` se crea automaticamente al iniciar la app.
