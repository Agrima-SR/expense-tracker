package jar.controller;

import jar.entity.Transaction;
import jar.repository.TransactionRepository;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin
public class TransactionController {

    private final TransactionRepository repository;

    public TransactionController(TransactionRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Transaction> getAllTransactions(
            @RequestParam String userEmail) {

        return repository.findByUserEmail(userEmail);
    }

    @PostMapping
    public Transaction addTransaction(
            @RequestParam String userEmail,
            @RequestBody Transaction transaction) {

        transaction.setUserEmail(userEmail);

        return repository.save(transaction);
    }

    @DeleteMapping("/{id}")
    public void deleteTransaction(
            @PathVariable Long id,
            @RequestParam String userEmail) {

        repository.findByIdAndUserEmail(id, userEmail)
                .ifPresent(repository::delete);
    }
}