CREATE TABLE IF NOT EXISTS admins (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  creado_en     DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS leyes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  slug            VARCHAR(200) NOT NULL UNIQUE,
  jurisdiccion    ENUM('provincial','nacional') NOT NULL,
  tipo            ENUM('ley','decreto','resolucion','estatuto') NOT NULL,
  numero          VARCHAR(50)  NOT NULL,
  titulo          VARCHAR(255) NOT NULL,
  resumen         TEXT,
  palabras_clave  TEXT,
  anio            SMALLINT NOT NULL,
  pdf_url         VARCHAR(500),
  pdf_public_id   VARCHAR(255),
  estado          ENUM('vigente','derogada') NOT NULL DEFAULT 'vigente',
  derogada_por    VARCHAR(255) NULL,
  creado_en       DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  creado_por      INT NULL,
  actualizado_por INT NULL,
  CONSTRAINT fk_leyes_creado_por      FOREIGN KEY (creado_por)      REFERENCES admins(id) ON DELETE SET NULL,
  CONSTRAINT fk_leyes_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES admins(id) ON DELETE SET NULL,
  INDEX idx_leyes_estado_jur (estado, jurisdiccion),
  INDEX idx_leyes_anio (anio),
  FULLTEXT INDEX ft_leyes (titulo, resumen, palabras_clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS categorias (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS niveles (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS leyes_categorias (
  ley_id       INT NOT NULL,
  categoria_id INT NOT NULL,
  PRIMARY KEY (ley_id, categoria_id),
  CONSTRAINT fk_lc_ley FOREIGN KEY (ley_id) REFERENCES leyes(id) ON DELETE CASCADE,
  CONSTRAINT fk_lc_cat FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS leyes_niveles (
  ley_id   INT NOT NULL,
  nivel_id INT NOT NULL,
  PRIMARY KEY (ley_id, nivel_id),
  CONSTRAINT fk_ln_ley FOREIGN KEY (ley_id) REFERENCES leyes(id) ON DELETE CASCADE,
  CONSTRAINT fk_ln_niv FOREIGN KEY (nivel_id) REFERENCES niveles(id) ON DELETE CASCADE
) ENGINE=InnoDB;
