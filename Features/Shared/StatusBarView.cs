using Spectre.Console;
using Spectre.Console.Rendering;

namespace GitVibe.Features.Shared;

public class StatusBarView(string branchName, bool isRefreshing = false) : Renderable
{
    protected override IEnumerable<Segment> Render(RenderOptions options, int maxWidth)
    {
        var table = new Table()
            .Expand()
            .NoBorder()
            .HideHeaders();

        table.AddColumn("Branch");
        table.AddColumn("Status", c => c.Centered());
        table.AddColumn("Legend", c => c.RightAligned());

        var refreshIndicator = isRefreshing 
            ? (IRenderable)new Markup("[yellow]Refreshing...[/]") 
            : Text.Empty;

        table.AddRow(
            new Markup($"[blue]On branch:[/] [white bold]{Markup.Escape(branchName)}[/]"),
            refreshIndicator,
            new Markup("[blue]Space[/] [white]Toggle[/] [blue]C[/] [white]Commit[/] [blue]B[/] [white]Branch[/] [blue]R[/] [white]Refresh[/] [blue]Esc[/] [white]Exit[/]")
        );

        return ((IRenderable)table).Render(options, maxWidth);
    }
}
