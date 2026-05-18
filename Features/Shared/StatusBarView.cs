using Spectre.Console;
using Spectre.Console.Rendering;

namespace GitVibe.Features.Shared;

public class StatusBarView(string branchName, bool isRefreshing = false, int spinnerIndex = 0) : Renderable
{
    private static readonly string[] SpinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

    protected override IEnumerable<Segment> Render(RenderOptions options, int maxWidth)
    {
        var table = new Table()
            .Expand()
            .NoBorder()
            .HideHeaders();

        table.AddColumn("Branch", c => c.NoWrap());
        table.AddColumn("Status", c => c.Centered());
        table.AddColumn("Legend", c => c.RightAligned());

        var frame = SpinnerFrames[spinnerIndex % SpinnerFrames.Length];
        var refreshIndicator = isRefreshing 
            ? (IRenderable)new Markup($"[yellow]{frame} Refreshing...[/]") 
            : Text.Empty;

        var legend = maxWidth < 80
            ? "[blue]Spc[/] [white]Tgl[/] [blue]C[/] [white]Cmt[/] [blue]B[/] [white]Br[/] [blue]R[/] [white]Ref[/] [blue]Esc[/] [white]Ext[/]"
            : "[blue]Space[/] [white]Toggle[/] [blue]C[/] [white]Commit[/] [blue]B[/] [white]Branch[/] [blue]R[/] [white]Refresh[/] [blue]Esc[/] [white]Exit[/]";

        if (maxWidth < 50)
        {
            legend = "[blue]C[/] [white]Cmt[/] [blue]B[/] [white]Br[/] [blue]Esc[/]";
        }

        table.AddRow(
            new Markup($"[blue]On:[/] [white bold]{Markup.Escape(branchName)}[/]"),
            refreshIndicator,
            new Markup(legend)
        );

        return ((IRenderable)table).Render(options, maxWidth);
    }
}
