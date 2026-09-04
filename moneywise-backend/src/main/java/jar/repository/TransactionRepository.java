package jar.repository;

import jar.entity.Transaction;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TransactionRepository
        extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUserEmail(String userEmail);

    Optional<Transaction> findByIdAndUserEmail(
            Long id,
            String userEmail
    );
}