package br.com.senac.formatura.sistema_gerenciamento_formaturas.controller;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.RelatorioFinanceiroDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.service.RelatorioFinanceiroService;

@RestController
@RequestMapping("/api/relatorios/financeiro")
public class RelatorioFinanceiroController {

    private final RelatorioFinanceiroService relatorioFinanceiroService;

    public RelatorioFinanceiroController(RelatorioFinanceiroService relatorioFinanceiroService) {
        this.relatorioFinanceiroService = relatorioFinanceiroService;
    }

    @GetMapping
    public RelatorioFinanceiroDTO visualizar(
        @RequestParam(required = false) Long turmaId,
        @RequestParam(name = "periodoMeses", defaultValue = "6") Integer periodoMeses
    ) {
        return relatorioFinanceiroService.gerarRelatorio(turmaId, periodoMeses);
    }

    @GetMapping(value = "/export/resumo.csv", produces = "text/csv")
    public ResponseEntity<byte[]> exportarResumoCsv(
        @RequestParam(required = false) Long turmaId,
        @RequestParam(name = "periodoMeses", defaultValue = "6") Integer periodoMeses
    ) {
        byte[] content = relatorioFinanceiroService.exportarResumoCsv(turmaId, periodoMeses);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, buildAttachmentHeader("relatorio-financeiro-resumo", "csv"))
            .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
            .body(content);
    }

    @GetMapping(value = "/export/lancamentos.csv", produces = "text/csv")
    public ResponseEntity<byte[]> exportarLancamentosCsv(
        @RequestParam(required = false) Long turmaId,
        @RequestParam(name = "periodoMeses", defaultValue = "6") Integer periodoMeses
    ) {
        byte[] content = relatorioFinanceiroService.exportarLancamentosCsv(turmaId, periodoMeses);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, buildAttachmentHeader("relatorio-financeiro-lancamentos", "csv"))
            .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
            .body(content);
    }

    @GetMapping(value = "/export/resumo.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> exportarResumoPdf(
        @RequestParam(required = false) Long turmaId,
        @RequestParam(name = "periodoMeses", defaultValue = "6") Integer periodoMeses
    ) {
        byte[] content = relatorioFinanceiroService.exportarResumoPdf(turmaId, periodoMeses);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, buildAttachmentHeader("relatorio-financeiro-resumo", "pdf"))
            .contentType(MediaType.APPLICATION_PDF)
            .body(content);
    }

    private String buildAttachmentHeader(String prefix, String extension) {
        String filename = prefix + "-" + LocalDate.now() + "." + extension;
        return ContentDisposition.attachment()
            .filename(filename, StandardCharsets.UTF_8)
            .build()
            .toString();
    }
}
