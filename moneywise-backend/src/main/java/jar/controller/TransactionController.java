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
    public List<Transaction> getAllTransactions() {
        return repository.findAll();
    }

    @PostMapping
    public Transaction addTransaction(@RequestBody Transaction transaction) {
        return repository.save(transaction);
    }

    @DeleteMapping("/{id}")
    public void deleteTransaction(@PathVariable Long id) {
        repository.deleteById(id);
    }
}