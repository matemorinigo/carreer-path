package com.carreerpath.repository;

import com.carreerpath.domain.Comision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComisionRepository extends JpaRepository<Comision, Long> {

    List<Comision> findByMateriaId(String materiaId);

    void deleteByMateriaId(String materiaId);
}
