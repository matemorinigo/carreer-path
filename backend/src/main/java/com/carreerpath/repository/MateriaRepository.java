package com.carreerpath.repository;

import com.carreerpath.domain.Materia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MateriaRepository extends JpaRepository<Materia, String> {

    List<Materia> findByEsObligatoria(boolean esObligatoria);

    List<Materia> findByMateriaPadreId(String materiaPadreId);

    Optional<Materia> findByNombreIgnoreCase(String nombre);

    List<Materia> findByAprobada(boolean aprobada);
}
