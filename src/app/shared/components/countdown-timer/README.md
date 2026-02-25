# Countdown Timer Component

Componente de contador regressivo circular flutuante para controle de tempo em operações críticas.

## Visão Geral

O `CountdownTimerComponent` é um relógio visual com contagem regressiva que exibe o tempo restante de forma clara e intuitiva. Projetado para garantir que operações sensíveis (como criação/edição de reservas) sejam finalizadas dentro de um prazo específico, evitando que recursos fiquem bloqueados indefinidamente.

## Recursos

- ✅ **Visual de Relógio Circular**: Animação SVG com progresso circular
- ✅ **Cores Dinâmicas**: Muda de verde → amarelo → vermelho conforme o tempo diminui
- ✅ **Posicionamento Flexível**: 4 posições disponíveis (cantos da tela)
- ✅ **Responsivo**: Adapta-se a diferentes tamanhos de tela
- ✅ **Auto-start**: Pode iniciar automaticamente ou sob demanda
- ✅ **Eventos**: Emite eventos a cada segundo e ao timeout
- ✅ **Controles**: Pausar, retomar, resetar e adicionar tempo
- ✅ **Alerta Visual**: Badge de "Tempo crítico!" quando < 20% restante

## Uso Básico

### Template HTML

```html
<app-countdown-timer
  [duracao]="300"
  [autoStart]="true"
  mensagem="Tempo para finalizar"
  position="bottom-right"
  (onTimeout)="handleTimeout()">
</app-countdown-timer>
```

### TypeScript

```typescript
export class MinhaTelaComponent {
  
  /**
   * Tratamento quando o tempo acaba
   */
  handleTimeout(): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Tempo Esgotado',
      detail: 'O tempo acabou. Retornando...',
      life: 5000
    });
    
    setTimeout(() => {
      this.router.navigate(['/rota-anterior']);
    }, 1000);
  }
  
  /**
   * Opcional: Monitorar cada tick (segundo)
   */
  handleTick(tempoRestante: number): void {
    console.log(`Tempo restante: ${tempoRestante}s`);
    
    // Exemplo: salvar rascunho a cada 30 segundos
    if (tempoRestante % 30 === 0) {
      this.salvarRascunho();
    }
  }
}
```

## Inputs

| Propriedade | Tipo | Padrão | Descrição |
|------------|------|--------|-----------|
| `duracao` | `number` | `300` | Duração total em segundos (5 minutos padrão) |
| `autoStart` | `boolean` | `true` | Inicia automaticamente ao carregar |
| `mensagem` | `string` | `'Tempo restante'` | Mensagem exibida acima do relógio |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'bottom-right'` | Posição na tela |

## Outputs

| Evento | Tipo | Descrição |
|--------|------|-----------|
| `onTimeout` | `void` | Emitido quando o tempo se esgota (0 segundos) |
| `onTick` | `number` | Emitido a cada segundo com o tempo restante |

## Cores do Timer

O componente muda de cor automaticamente baseado no percentual restante:

| Percentual | Cor | Hex | Significado |
|-----------|-----|-----|-------------|
| > 50% | 🟢 Verde | `#10b981` | Tempo confortável |
| 20-50% | 🟡 Amarelo | `#f59e0b` | Atenção, tempo se esgotando |
| < 20% | 🔴 Vermelho | `#ef4444` | Tempo crítico! |

## Métodos Públicos

Você pode acessar métodos do componente via `@ViewChild`:

```typescript
@ViewChild(CountdownTimerComponent) countdown!: CountdownTimerComponent;

// Pausar o timer
pausarTimer(): void {
  this.countdown.pausar();
}

// Retomar
retomarTimer(): void {
  this.countdown.retomar();
}

// Adicionar 1 minuto extra
darMaisTempo(): void {
  this.countdown.adicionarTempo(60);
}

// Resetar para tempo inicial
resetarTimer(): void {
  this.countdown.resetar();
}
```

## Casos de Uso

### 1. Reserva de Unidades (Atual)

Implementado em `reserva-nova` e `reserva-edicao` para garantir que o processo de venda seja dinâmico:

- ⏱️ **5 minutos** para finalizar reserva
- Se o tempo acabar, descarta alterações e volta para o mapa de unidades
- Evita que unidades fiquem "travadas" por vendedores que abandonaram a tela

### 2. Edição de Registros Críticos

Use em qualquer formulário de edição onde o bloqueio otimista precisa ser liberado após um tempo:

```html
<app-countdown-timer
  [duracao]="600"
  mensagem="Tempo de bloqueio"
  (onTimeout)="liberarBloqueio()">
</app-countdown-timer>
```

### 3. Sessões Temporárias

Controle de sessões com tempo limitado:

```html
<app-countdown-timer
  [duracao]="1800"
  mensagem="Sessão temporária"
  (onTimeout)="expirarSessao()"
  (onTick)="salvarProgresso($event)">
</app-countdown-timer>
```

## Customização Visual

### Desabilitar Controles (Padrão)

Os controles de pausa/adicionar tempo estão ocultos por padrão via `*ngIf="false"` no template. Para habilitar durante desenvolvimento:

```html
<!-- No countdown-timer.component.html -->
<div class="timer-controles" *ngIf="true"> <!-- Mude para true -->
```

### Ajustar Tamanho do Relógio

Edite `countdown-timer.component.scss`:

```scss
.timer-circle-wrapper {
  width: 160px;  // Padrão: 140px
  height: 160px; // Padrão: 140px
}

.timer-tempo {
  font-size: 2.5rem;  // Padrão: 2rem
}
```

### Alterar Posicionamento

Customize as posições editando as classes CSS:

```scss
.countdown-timer-container {
  &.countdown-timer-bottom-right {
    bottom: 30px;  // Ajuste conforme necessário
    right: 30px;
  }
}
```

## Comportamento Mobile

O componente é totalmente responsivo:

- **Desktop**: Relógio de 140x140px
- **Mobile** (< 768px): Relógio de 120x120px
- **Posicionamento**: Ajusta margens automaticamente

## Acessibilidade

- Cores com contraste adequado (WCAG AA)
- Animações suaves para evitar desconforto
- Badge de alerta quando tempo crítico
- Mensagens claras e objetivas

## Performance

- Usa `requestAnimationFrame` para animações suaves
- Limite de 1 intervalo ativo por vez
- Cleanup automático no `ngOnDestroy`
- SVG otimizado para performance

## Integração com Backend (Future)

Para sincronizar com tempo de bloqueio do backend:

```typescript
iniciarReserva(): void {
  this.reservaService.bloquearUnidade(this.unidadeId).subscribe(response => {
    // Backend retorna tempo de bloqueio em segundos
    this.duracaoTimer = response.tempoBloqueioDuration;
  });
}
```

## Testes

Exemplo de teste unitário:

```typescript
describe('CountdownTimerComponent', () => {
  it('deve emitir onTimeout quando tempo acabar', fakeAsync(() => {
    const component = new CountdownTimerComponent();
    component.duracao = 3; // 3 segundos
    
    let timeoutEmitido = false;
    component.onTimeout.subscribe(() => {
      timeoutEmitido = true;
    });
    
    component.iniciar();
    tick(3000);
    
    expect(timeoutEmitido).toBe(true);
  }));
});
```

## Troubleshooting

### Timer não aparece

✅ Verifique se `SharedModule` está importado no módulo da feature  
✅ Confirme que o componente está declarado e exportado no `SharedModule`

### Eventos não disparam

✅ Certifique-se que os métodos do `@Output` estão definidos no componente pai  
✅ Verifique console de erros no navegador

### Cores não mudam

✅ Calcule `percentualProgresso` está sendo atualizado corretamente  
✅ Verifique se CSS está carregado (inspecione elemento no DevTools)

## Roadmap

Melhorias futuras planejadas:

- [ ] Som de alerta quando tempo < 1 minuto
- [ ] Opção de "estender tempo" via dialog
- [ ] Persistência em localStorage para sobreviver a reloads
- [ ] Sincronização com tempo do servidor
- [ ] Modo "compacto" (apenas números, sem círculo)
- [ ] Notificação push quando em outra aba

## Changelog

### v1.0.0 (23/02/2026)
- ✨ Release inicial
- ✅ Relógio circular SVG animado
- ✅ 4 posições de tela
- ✅ Cores dinâmicas (verde/amarelo/vermelho)
- ✅ Integração em reserva-nova e reserva-edicao

## Licença

Uso interno - Construtora RJ / Taurus Front

---

**Documentação atualizada:** 23/02/2026  
**Autor:** Sistema Taurus Front  
**Componente:** `shared/components/countdown-timer`
