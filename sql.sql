-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         10.4.32-MariaDB - mariadb.org binary distribution
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para mantenimiento_iub
CREATE DATABASE IF NOT EXISTS `mantenimiento_iub` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `mantenimiento_iub`;

-- Volcando estructura para tabla mantenimiento_iub.evaluaciones
CREATE TABLE IF NOT EXISTS `evaluaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tecnico_id` int(11) NOT NULL,
  `supervisor_id` int(11) NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `observaciones` text DEFAULT NULL,
  `puntaje` decimal(3,1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tecnico_id` (`tecnico_id`),
  KEY `supervisor_id` (`supervisor_id`),
  CONSTRAINT `Evaluaciones_ibfk_1` FOREIGN KEY (`tecnico_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `Evaluaciones_ibfk_2` FOREIGN KEY (`supervisor_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla mantenimiento_iub.evaluaciones: ~0 rows (aproximadamente)

-- Volcando estructura para tabla mantenimiento_iub.evidencias
CREATE TABLE IF NOT EXISTS `evidencias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tarea_id` int(11) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `uploaded_by` int(11) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `tarea_id` (`tarea_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `Evidencias_ibfk_1` FOREIGN KEY (`tarea_id`) REFERENCES `tareas` (`id`),
  CONSTRAINT `Evidencias_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla mantenimiento_iub.evidencias: ~0 rows (aproximadamente)

-- Volcando estructura para tabla mantenimiento_iub.incidencias
CREATE TABLE IF NOT EXISTS `incidencias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ubicacion_id` int(11) NOT NULL,
  `tipo_dano` text NOT NULL,
  `prioridad` enum('baja','media','alta') NOT NULL,
  `fecha_reporte` datetime NOT NULL,
  `descripcion` text NOT NULL,
  `reportado_por` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_ubicacion_id` (`ubicacion_id`),
  KEY `fk_reportado_por` (`reportado_por`),
  CONSTRAINT `fk_reportado_por` FOREIGN KEY (`reportado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ubicacion_id` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicaciones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla mantenimiento_iub.incidencias: ~1 rows (aproximadamente)
INSERT INTO `incidencias` (`id`, `ubicacion_id`, `tipo_dano`, `prioridad`, `fecha_reporte`, `descripcion`, `reportado_por`) VALUES
	(22, 15, 'SILLA ESTUDIANTE, SILLA DOCENTE', 'alta', '2025-08-07 15:11:34', 'eae', 2);

-- Volcando estructura para tabla mantenimiento_iub.inventario
CREATE TABLE IF NOT EXISTS `inventario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `tipo` enum('herramienta','material') NOT NULL,
  `cantidad_disponible` int(11) NOT NULL DEFAULT 0,
  `ubicacion_id` int(11) NOT NULL,
  `descripcion` varchar(255) NOT NULL DEFAULT 'Sin descripcion',
  PRIMARY KEY (`id`),
  KEY `ubicacion_id` (`ubicacion_id`),
  CONSTRAINT `Inventario_ibfk_1` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicacion` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla mantenimiento_iub.inventario: ~0 rows (aproximadamente)

-- Volcando estructura para tabla mantenimiento_iub.mantenimientospreventivos
CREATE TABLE IF NOT EXISTS `mantenimientospreventivos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tarea_nombre` varchar(255) NOT NULL,
  `frecuencia_dias` int(11) NOT NULL,
  `ultima_ejecucion` datetime DEFAULT NULL,
  `proxima_ejecucion` datetime DEFAULT NULL,
  `area_responsable` varchar(255) DEFAULT NULL,
  `responsable_id` int(11) DEFAULT NULL,
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  `descripcion` varchar(255) DEFAULT NULL,
  `ubicacion_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `responsable_id` (`responsable_id`),
  KEY `fk_ubicacion` (`ubicacion_id`),
  CONSTRAINT `fk_ubicacion` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicaciones` (`id`),
  CONSTRAINT `mantenimientospreventivos_ibfk_1` FOREIGN KEY (`responsable_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla mantenimiento_iub.mantenimientospreventivos: ~0 rows (aproximadamente)

-- Volcando estructura para tabla mantenimiento_iub.materiales_y_herramientas
CREATE TABLE IF NOT EXISTS `materiales_y_herramientas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ubicacion_id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `tipo` enum('material','herramienta') NOT NULL,
  `cantidad_disponible` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ubicacion_id` (`ubicacion_id`),
  CONSTRAINT `Materiales_y_Herramientas_ibfk_1` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicacion` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla mantenimiento_iub.materiales_y_herramientas: ~0 rows (aproximadamente)

-- Volcando estructura para tabla mantenimiento_iub.reportes
CREATE TABLE IF NOT EXISTS `reportes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fecha` datetime NOT NULL,
  `resumen_actividades` text DEFAULT NULL,
  `estadisticas_generales` text DEFAULT NULL,
  `listado_trabajadores` text DEFAULT NULL,
  `total_horas` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla mantenimiento_iub.reportes: ~0 rows (aproximadamente)

-- Volcando estructura para tabla mantenimiento_iub.solicitudesinternas
CREATE TABLE IF NOT EXISTS `solicitudesinternas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `solicitante` varchar(255) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `ubicacion_id` int(11) DEFAULT NULL,
  `tipo_solicitud` varchar(50) DEFAULT NULL,
  `estado` enum('recibida','procesando','completada') DEFAULT NULL,
  `fecha_solicitud` timestamp NOT NULL DEFAULT current_timestamp(),
  `asignado_a` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ubicacion_id` (`ubicacion_id`),
  KEY `asignado_a` (`asignado_a`),
  CONSTRAINT `SolicitudesInternas_ibfk_1` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicacion` (`id`),
  CONSTRAINT `SolicitudesInternas_ibfk_2` FOREIGN KEY (`asignado_a`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla mantenimiento_iub.solicitudesinternas: ~0 rows (aproximadamente)

-- Volcando estructura para tabla mantenimiento_iub.tareas
CREATE TABLE IF NOT EXISTS `tareas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `incidencia_id` int(11) NOT NULL,
  `tecnico_id` int(11) NOT NULL,
  `supervisor_id` int(11) NOT NULL,
  `reportado_por` int(11) NOT NULL,
  `estado` enum('pendiente','en_proceso','completada') DEFAULT 'pendiente',
  `fecha_inicio` datetime DEFAULT current_timestamp(),
  `fecha_limite` date DEFAULT NULL,
  `fecha_asignacion` datetime DEFAULT current_timestamp(),
  `fallas_reportadas` text DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `prioridad` enum('baja','media','alta') DEFAULT 'media',
  PRIMARY KEY (`id`),
  KEY `incidencia_id` (`incidencia_id`),
  KEY `tecnico_id` (`tecnico_id`),
  KEY `supervisor_id` (`supervisor_id`),
  KEY `reportado_por` (`reportado_por`),
  CONSTRAINT `tareas_ibfk_1` FOREIGN KEY (`incidencia_id`) REFERENCES `incidencias` (`id`),
  CONSTRAINT `tareas_ibfk_2` FOREIGN KEY (`tecnico_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `tareas_ibfk_3` FOREIGN KEY (`supervisor_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `tareas_ibfk_4` FOREIGN KEY (`reportado_por`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla mantenimiento_iub.tareas: ~1 rows (aproximadamente)
INSERT INTO `tareas` (`id`, `incidencia_id`, `tecnico_id`, `supervisor_id`, `reportado_por`, `estado`, `fecha_inicio`, `fecha_limite`, `fecha_asignacion`, `fallas_reportadas`, `descripcion`, `prioridad`) VALUES
	(4, 22, 1, 2, 2, 'pendiente', '2025-08-07 15:43:51', '2025-09-17', '2025-08-07 15:43:51', 'SILLA ESTUDIANTE, SILLA DOCENTE', 'dasdsadas', 'media');

-- Volcando estructura para tabla mantenimiento_iub.tarea_inventario
CREATE TABLE IF NOT EXISTS `tarea_inventario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tarea_id` int(11) NOT NULL,
  `inventario_id` int(11) NOT NULL,
  `cantidad_utilizada` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `tarea_id` (`tarea_id`),
  KEY `inventario_id` (`inventario_id`),
  CONSTRAINT `Tarea_Inventario_ibfk_1` FOREIGN KEY (`tarea_id`) REFERENCES `tareas` (`id`),
  CONSTRAINT `Tarea_Inventario_ibfk_2` FOREIGN KEY (`inventario_id`) REFERENCES `inventario` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla mantenimiento_iub.tarea_inventario: ~0 rows (aproximadamente)

-- Volcando estructura para tabla mantenimiento_iub.tarea_material
CREATE TABLE IF NOT EXISTS `tarea_material` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tarea_id` int(11) NOT NULL,
  `material_id` int(11) NOT NULL,
  `cantidad_utilizada` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `tarea_id` (`tarea_id`),
  KEY `material_id` (`material_id`),
  CONSTRAINT `Tarea_Material_ibfk_1` FOREIGN KEY (`tarea_id`) REFERENCES `tareas` (`id`),
  CONSTRAINT `Tarea_Material_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `materiales_y_herramientas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla mantenimiento_iub.tarea_material: ~0 rows (aproximadamente)

-- Volcando estructura para tabla mantenimiento_iub.ubicaciones
CREATE TABLE IF NOT EXISTS `ubicaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bloque` varchar(10) NOT NULL,
  `piso` varchar(10) NOT NULL,
  `salon` varchar(10) NOT NULL,
  `recurso` varchar(50) NOT NULL,
  `qr_code` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `ubicacion_unica` (`bloque`,`piso`,`salon`,`recurso`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=125 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla mantenimiento_iub.ubicaciones: ~112 rows (aproximadamente)
INSERT INTO `ubicaciones` (`id`, `bloque`, `piso`, `salon`, `recurso`, `qr_code`) VALUES
	(1, 'A', '1', '1-1', 'SALÓN MAGISTRAL A1-1', NULL),
	(2, 'A', '1', '1-2', 'SALÓN A1-2', NULL),
	(3, 'A', '1', '1-3', 'SALÓN A1-3', NULL),
	(4, 'A', '1', '1-5', 'SALÓN A1-5', NULL),
	(5, 'A', '1', '1-6', 'SALÓN A1-6', NULL),
	(6, 'A', '1', '1-7', 'SALÓN A1-7', NULL),
	(7, 'A', '1', '1-8', 'SALÓN A1-8', NULL),
	(8, 'A', '1', '1-9', 'SALÓN A1-9', NULL),
	(9, 'A', '1', '1-1', 'LAB FÍSICA A1-1', NULL),
	(10, 'A', '1', '1-2', 'SALA INF A1-2', NULL),
	(11, 'A', '1', 'baño', 'BAÑO ESTUDIANTES DAMAS', NULL),
	(12, 'A', '1', 'baño', 'BAÑO ESTUDIANTES HOMBRES', NULL),
	(13, 'A', '1', 'otros', 'OTRAS', NULL),
	(14, 'A', '2', '2-1', 'SALÓN A2-1 LAB.HIG', NULL),
	(15, 'A', '2', '2-2', 'SALÓN A2-2', NULL),
	(16, 'A', '2', '2-3', 'SALÓN A2-3', NULL),
	(17, 'A', '2', '2-4', 'SALÓN A2-4', NULL),
	(18, 'A', '2', '2-5', 'SALÓN A2-5', NULL),
	(19, 'A', '2', '2-6', 'SALÓN A2-6', NULL),
	(20, 'A', '2', '2-7', 'SALÓN A2-7', NULL),
	(21, 'A', '2', '2-8', 'SALÓN A2-8', NULL),
	(22, 'A', '2', '2-9', 'SALÓN A2-9', NULL),
	(23, 'A', '2', 'otros', 'OTRAS', NULL),
	(24, 'A', 'azotea', 'azotea', 'AZOTEA BLOQUE A', NULL),
	(25, 'B', '1', '1-1', 'CONSULTORIO', NULL),
	(26, 'B', '1', '1-2', 'BIENESTAR', NULL),
	(27, 'B', '1', '1-3', 'SALA DE ESPERA BIENESTAR', NULL),
	(28, 'B', '1', '1-4', 'MONITORIAS', NULL),
	(29, 'B', '1', '1-5', 'SALÓN INTERACTIVO', NULL),
	(30, 'B', '1', '1-6', 'SALÓN DE ARTES', NULL),
	(31, 'B', '1', '1-7', 'LAB B1-2', NULL),
	(32, 'B', '1', '1-8', 'BAÑO ESTUDIANTES DAMAS', NULL),
	(33, 'B', '1', '1-9', 'BAÑO ESTUDIANTES HOMBRES', NULL),
	(34, 'B', '1', '1-10', 'BAÑO DAMAS BIENESTAR', NULL),
	(35, 'B', '1', '1-11', 'BAÑO HOMBRES BIENESTAR', NULL),
	(36, 'B', '1', 'otros', 'OTRAS', NULL),
	(37, 'B', '2', '2-1', 'SALA B2-1', NULL),
	(38, 'B', '2', '2-2', 'FACULTADES', NULL),
	(39, 'B', '2', '2-3', 'CONTAC CENTER', NULL),
	(40, 'B', '2', '2-4', 'INFRAESTRUCTURA FÍSICA / SISTEMA INTEGRADO GESTIÓN', NULL),
	(41, 'B', '2', '2-5', 'SALA DE PROFESORES', NULL),
	(42, 'B', '2', '2-6', 'BAÑO DOCENTES DAMAS', NULL),
	(43, 'B', '2', '2-7', 'BAÑO DOCENTES HOMBRES', NULL),
	(44, 'B', '2', 'otros', 'OTRAS', NULL),
	(45, 'B', '3', '3-1', 'LAB B3-3', NULL),
	(46, 'B', '3', '3-2', 'LAB B3-4', NULL),
	(47, 'B', '3', '3-3', 'TECNOLOGÍA Y SISTEMA DE LA INFORMACIÓN', NULL),
	(48, 'B', '3', '3-4', 'BAÑO TECNOLOGÍA Y SISTEMA', NULL),
	(49, 'B', '3', 'otros', 'OTRAS', NULL),
	(50, 'B', '4', '4-1', 'LAB B4-3', NULL),
	(51, 'B', '4', '4-2', 'LAB B4-5', NULL),
	(52, 'B', '4', '4-3', 'LAB B4-6', NULL),
	(53, 'B', '4', '4-4', 'LAB B4-7', NULL),
	(54, 'B', '4', '4-5', 'SALA B4-2', NULL),
	(55, 'B', '4', 'otros', 'OTRAS', NULL),
	(56, 'B', 'azotea', 'azotea', 'AZOTEA BLOQUE B', NULL),
	(57, 'D', '1', '1-1', 'LAB D1-14 LOGÍSTICA', NULL),
	(58, 'D', '1', '1-2', 'LAB D1-10 METROLOGÍA', NULL),
	(59, 'D', '1', '1-3', 'LAB D1-11 SOLDADURA', NULL),
	(60, 'D', '1', '1-4', 'LAB D1-12 MECANIZADO', NULL),
	(61, 'E', '1', '1-1', 'BODEGA ALMACÉN', NULL),
	(62, 'E', '1', '1-2', 'SALÓN E1-4', NULL),
	(63, 'E', '1', '1-3', 'LAB E1-13', NULL),
	(64, 'E', '1', '1-4', 'ALMACÉN', NULL),
	(65, 'E', '1', '1-5', 'ARCHIVO CENTRAL', NULL),
	(66, 'E', '1', '1-6', 'SERVIDORES 2', NULL),
	(67, 'E', '1', '1-7', 'SALA DE INFORMÁTICA E1-7', NULL),
	(68, 'E', '1', '1-8', 'SALA DE INFORMÁTICA E1-8', NULL),
	(69, 'E', '1', '1-9', 'BAÑO FUNCIONARIOS', NULL),
	(70, 'E', '1', 'otros', 'OTRAS', NULL),
	(71, 'E', '2', '2-1', 'CUARTO DE ASEO', NULL),
	(72, 'E', '2', '2-2', 'RECTORÍA', NULL),
	(73, 'E', '2', '2-3', 'ASISTENTE DE RECTORÍA', NULL),
	(74, 'E', '2', '2-4', 'VICERECTORÍA ADMINISTRATIVA Y FINANCIERA', NULL),
	(75, 'E', '2', '2-5', 'PLANEACIÓN', NULL),
	(76, 'E', '2', '2-6', 'COMUNICACIÓN ESTRATÉGICA', NULL),
	(77, 'E', '2', '2-7', 'CONTROL INTERNO', NULL),
	(78, 'E', '2', '2-8', 'TALENTO HUMANO', NULL),
	(79, 'E', '2', '2-9', 'TALENTO HUMANO 2 (SELECCIÓN PERSONAL)', NULL),
	(80, 'E', '2', '2-10', 'VICERRECTORÍA ACADÉMICA', NULL),
	(81, 'E', '2', '2-11', 'VICERRECTORÍA DE INVESTIGACIÓN', NULL),
	(82, 'E', '2', '2-12', 'SALA DE JUNTAS DE SOLEDAD', NULL),
	(83, 'E', '2', '2-13', 'COCINA', NULL),
	(84, 'E', '2', '2-14', 'BAÑO DAMAS', NULL),
	(85, 'E', '2', '2-15', 'BAÑO RECTOR', NULL),
	(86, 'E', '2', 'otros', 'OTRAS', NULL),
	(87, 'E', 'azotea', 'azotea', 'AZOTEA BLOQUE E', NULL),
	(88, 'F', '1', '1-1', 'EMISORA', NULL),
	(89, 'F', '1', '1-2', 'LABORATORIO DE AGUAS', NULL),
	(90, 'F', '1', '1-3', 'BAÑO CANCHA DAMAS', NULL),
	(91, 'F', '1', '1-4', 'BAÑO CANCHA HOMBRES', NULL),
	(92, 'F', 'azotea', 'azotea', 'AZOTEA BLOQUE F', NULL),
	(93, 'BIBLIOTECA', '1', '1-1', 'SALA DE LECTURA', NULL),
	(94, 'BIBLIOTECA', '1', '1-2', 'CIRCULACIÓN Y PRÉSTAMO', NULL),
	(95, 'BIBLIOTECA', '1', '1-3', 'SALA BIBLIOTECA VIRTUAL', NULL),
	(96, 'BIBLIOTECA', '1', '1-4', 'COORDINACIÓN DE BIBLIOTECA', NULL),
	(97, 'CEL', '1', '1-1', 'PRIMER PISO BLOQUE CEL', NULL),
	(98, 'CEL', '2', '2-1', 'SEGUNDO PISO BLOQUE CEL', NULL),
	(99, 'CEL', 'azotea', 'azotea', 'AZOTEA', NULL),
	(100, 'CAFETERIA', '1', '1-1', 'BLOQUE CAFETERIA', NULL),
	(101, 'PORTERIA', '1', '1-1', 'BLOQUE PORTERIA', NULL),
	(114, 'CEL', '1', 'SALÓN CEL ', 'Salón', NULL),
	(115, 'CEL', '1', 'CUARTO SIS', 'Cuarto técnico', NULL),
	(116, 'CEL', '1', 'ASEGURAMIE', 'Oficina', NULL),
	(117, 'CEL', '1', 'EGRESADOS,', 'Oficina', NULL),
	(118, 'CEL', '1', 'RECEPCIÓN ', 'Recepción', NULL),
	(119, 'CEL', '1', 'COCINA CEL', 'Cocina', NULL),
	(120, 'CEL', '1', 'SALA INF C', 'Sala informática', NULL),
	(121, 'CEL', '1', 'BAÑO ESTUD', 'Baño', NULL),
	(122, 'CEL', '1', 'Otras', 'Otro', NULL),
	(123, 'CEL', '2', 'SALÓN CEL ', 'Salón', NULL),
	(124, 'CEL', '2', 'OFICINA SI', 'Oficina', NULL);

-- Volcando estructura para tabla mantenimiento_iub.usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_completo` varchar(255) NOT NULL,
  `correo` varchar(255) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `cargo` enum('supervisor','tecnico','rector','estudiante') NOT NULL,
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  PRIMARY KEY (`id`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla mantenimiento_iub.usuarios: ~5 rows (aproximadamente)
INSERT INTO `usuarios` (`id`, `nombre_completo`, `correo`, `contrasena`, `cargo`, `estado`) VALUES
	(1, 'Dylan Echavarria', 'dechavarria@unibarranquilla.edu.co', '$2b$10$uG/C0JCfhaDmN9n5Ih8dsOV5yQ/oeMQmQObwT/XwRFLrmJ7xCJyaG', 'tecnico', 'activo'),
	(2, 'Juan Pablo Olivera', 'jpolivera@unibarranquilla.edu.co', '$2b$10$uG/C0JCfhaDmN9n5Ih8dsOV5yQ/oeMQmQObwT/XwRFLrmJ7xCJyaG', 'supervisor', 'activo'),
	(3, 'Mauricio Habib Silebi', 'msilebi@unibarranquilla.edu.co', '$2b$10$uG/C0JCfhaDmN9n5Ih8dsOV5yQ/oeMQmQObwT/XwRFLrmJ7xCJyaG', 'rector', 'activo'),
	(4, 'Carlos Andres Herrera', 'carlosandresherrera@unibarranquilla.edu.co', '$2b$10$uG/C0JCfhaDmN9n5Ih8dsOV5yQ/oeMQmQObwT/XwRFLrmJ7xCJyaG', 'supervisor', 'activo'),
	(5, 'Jp p', 'jp@unibarranquilla.edu.co', '$2b$10$uG/C0JCfhaDmN9n5Ih8dsOV5yQ/oeMQmQObwT/XwRFLrmJ7xCJyaG', 'estudiante', 'activo');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
